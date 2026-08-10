/**
 * Tenant Signature Utility
 *
 * Generates tenant verification headers for IAM Techno Public API.
 * Uses RSA PS256 (RSA-PSS + SHA-256) as required by TenantVerificationService.
 *
 * Canonical string format:
 *   {timestamp}\n{method}\n{scheme}://{host}\n{pathAndQuery}\n{kid}\n{bodyHash}\n{nonce}
 *
 * Body hash = SHA-256 of canonicalized JSON (keys sorted alphabetically)
 */

import crypto from "crypto";
import { env } from "@/config/env.config";

export interface ITenantHeaders {
  "X-App-Identifier": string;
  "X-Timestamp": string;
  "X-Nonce": string;
  "X-Key-Id": string;
  "X-Signature": string;
  APIKey: string;
  "Content-Type"?: string;
}

/**
 * Canonicalize JSON: sort keys alphabetically, remove whitespace.
 * e.g. {"b": 2, "a": 1} → {"a":1,"b":2}
 */
function canonicalizeJson(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, Object.keys(parsed).sort());
  } catch {
    // If not valid JSON, return as-is
    return body;
  }
}

/**
 * Generate a UUID-based nonce.
 */
function generateNonce(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/**
 * Build the canonical string for signing.
 */
function buildCanonicalString(
  timestamp: string,
  method: string,
  scheme: string,
  host: string,
  pathAndQuery: string,
  kid: string,
  bodyHash: string,
  nonce: string,
): string {
  return `${timestamp}\n${method}\n${scheme}://${host}\n${pathAndQuery}\n${kid}\n${bodyHash}\n${nonce}`;
}

/**
 * Normalize the raw RSA_PRIVATE_KEY env value into a PEM string.
 *
 * Supports three formats:
 *  1. PEM with literal `\n` escapes (single-line .env, see .env.example)
 *  2. PEM with real newlines
 *  3. Base64-encoded PEM (as printed by the backend seeder TenantExampleSeeder)
 */
function normalizePrivateKey(rawKey: string): string {
  // Formats 1 & 2: PEM with \n escapes or real newlines
  let pem = rawKey.replace(/\\n/g, "\n").trim();
  if (!pem.includes("-----BEGIN")) {
    // Format 3: base64-encoded PEM → decode to PEM text
    pem = Buffer.from(rawKey.trim(), "base64").toString("utf8");
  }
  return pem.trim();
}

/**
 * Sign a canonical string with RSA-PSS + SHA-256 (PS256).
 */
function signWithRsa(privateKeyPem: string, canonicalString: string): string {
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(canonicalString);
  sign.end();

  return sign.sign(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    },
    "base64",
  );
}

/**
 * Generate tenant verification headers for a request.
 *
 * @param method   - HTTP method (GET, POST, PUT, DELETE)
 * @param path     - Request path (e.g., "/public/manual/login")
 * @param body     - Optional request body string (for POST/PUT)
 * @param queryString - Optional query string (e.g., "?page=1&limit=10")
 */
export async function generateTenantHeaders(
  method: string,
  path: string,
  body?: string,
  queryString?: string,
): Promise<ITenantHeaders> {
  const resolvedEnv = await env();
  console.log("Resolved Env:", resolvedEnv);
  const {
    APP_IDENTIFIER,
    API_KEY,
    RSA_PRIVATE_KEY,
    KEY_ID,
    BYPASS_PRODUCT_VERIFICATION,
    API_URL,
  } = resolvedEnv.APP;

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");
  const nonce = generateNonce();

  // Parse the backend URL for scheme + host
  const backendUrl = new URL(API_URL);
  const scheme = backendUrl.protocol.replace(":", "");
  const host = backendUrl.host;

  // Build path with query
  const pathAndQuery = queryString ? `${path}${queryString}` : path;

  // Compute body hash
  const bodyStr = body || "";
  const canonicalBody = bodyStr ? canonicalizeJson(bodyStr) : "";
  const bodyHash = crypto
    .createHash("sha256")
    .update(canonicalBody)
    .digest("base64");

  // Build canonical string
  const canonicalString = buildCanonicalString(
    timestamp,
    method.toUpperCase(),
    scheme,
    host,
    pathAndQuery,
    KEY_ID,
    bodyHash,
    nonce,
  );

  // Sign with RSA (skip if bypass enabled for dev)
  let signature = "";
  if (!BYPASS_PRODUCT_VERIFICATION) {
    if (!RSA_PRIVATE_KEY) {
      throw new Error(
        "RSA_PRIVATE_KEY is required when BYPASS_PRODUCT_VERIFICATION is not enabled",
      );
    }
    const privateKey = normalizePrivateKey(RSA_PRIVATE_KEY);
    signature = signWithRsa(privateKey, canonicalString);
  }

  return {
    "X-App-Identifier": APP_IDENTIFIER,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Key-Id": KEY_ID,
    "X-Signature": signature,
    APIKey: API_KEY,
  };
}
