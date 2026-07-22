"use server";

import CryptoJS from "crypto-js";
import { env } from "@/config/env.config";

const getKey = async () => {
  const resolved = await env();
  const saltHex = Buffer.from(resolved.ENCRYPTION.SALT_KEY, "utf8").toString(
    "hex",
  );
  const salt = CryptoJS.enc.Hex.parse(saltHex);

  return CryptoJS.PBKDF2(resolved.ENCRYPTION.SECRET_KEY, salt, {
    keySize: 256 / 32,
    iterations: 65536,
    hasher: CryptoJS.algo.SHA256,
  });
};

const makeUrlSafe = (str: string) =>
  str.replaceAll("+", "-").replaceAll(/\//g, "_").replace(/=+$/, "");

const revertUrlSafe = (str: string) => {
  let result = str.replaceAll(/-/g, "+").replaceAll(/_/g, "/");
  while (result.length % 4) result += "=";
  return result;
};

export const encryptAES = async (strToEncrypt: string): Promise<string> => {
  try {
    const key = await getKey();
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(strToEncrypt),
      key,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );

    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const ciphertextBase64 = encrypted.toString();
    const combined = `${ivBase64}:${ciphertextBase64}`;

    return encodeURIComponent(makeUrlSafe(combined));
  } catch (error) {
    throw new Error(`Encryption failed: ${error}`);
  }
};

export const decryptAES = async (strToDecrypt: string): Promise<string> => {
  try {
    if (!strToDecrypt) throw new Error("Empty string to decrypt");

    const key = await getKey();
    const decoded = decodeURIComponent(strToDecrypt);
    const base64Str = revertUrlSafe(decoded);
    const [ivBase64, ciphertextBase64] = base64Str.split(":");

    if (!ivBase64 || !ciphertextBase64) {
      throw new Error("Invalid encrypted string format");
    }

    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const decrypted = CryptoJS.AES.decrypt(ciphertextBase64, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
};
