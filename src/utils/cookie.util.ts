"use server";

import { cookies } from "next/headers";
import { env } from "@/config/env.config";
import { ITokens } from "@/types/auth.types";
import { decryptAES, encryptAES } from "./encryption.util";

export const getToken = async (): Promise<ITokens | null> => {
  try {
    const cookieStore = await cookies();
    const encrypted = cookieStore.get("token")?.value;
    if (!encrypted) return null;

    const decrypted = await decryptAES(encrypted);
    if (!decrypted) return null;

    return JSON.parse(decrypted) as ITokens;
  } catch {
    return null;
  }
};

export const setToken = async (tokens: ITokens): Promise<boolean> => {
  try {
    const resolvedEnv = await env();
    const maxAge = resolvedEnv.APP.COOKIES.MAX_AGE_IN_DAYS;
    const cookieStore = await cookies();
    const encrypted = await encryptAES(JSON.stringify(tokens));

    cookieStore.set("token", encrypted, {
      expires: new Date(Date.now() + maxAge * 1000 * 60 * 60 * 24),
      sameSite: "strict",
      secure: true,
      httpOnly: true,
      path: "/",
    });

    return true;
  } catch {
    return false;
  }
};

export const clearToken = async (): Promise<void> => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");
  } catch {
    // ignore — cookie already cleared
  }
};
