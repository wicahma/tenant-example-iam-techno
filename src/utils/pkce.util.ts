/**
 * PKCE (Proof Key for Code Exchange) Utility
 *
 * Generates code_verifier and code_challenge for OAuth 2.0 Authorization Code Flow with PKCE.
 * Uses Web Crypto API (available in both browser and Node.js 19+).
 */

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate a cryptographically random code verifier (43-128 chars).
 */
export function generateCodeVerifier(): string {
  const randomBytes = new Uint8Array(64);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes.buffer);
}

/**
 * Generate a code challenge from a code verifier using SHA-256 (S256 method).
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

/**
 * Generate a random state parameter for OAuth CSRF protection.
 */
export function generateState(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes.buffer);
}
