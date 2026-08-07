/**
 * PKCE handoff storage for the OAuth flow.
 *
 * A popup / new tab opened with window.open() receives a CLONE of the opener's
 * sessionStorage at the moment it is opened. Writing the PKCE data to
 * sessionStorage after the popup is opened never reaches the callback page,
 * which caused "State mismatch — possible CSRF attack!".
 *
 * localStorage is shared live across all same-origin tabs/popups (not cloned),
 * so we store the PKCE data there. sessionStorage is kept as a same-tab
 * fallback so a direct (non-popup) navigation still works.
 */

export interface PkceData {
  codeVerifier: string;
  state: string;
  redirectUri?: string;
  clientId?: string;
}

const STORAGE_KEY = "oauth_pkce";

export const savePkce = (data: PkceData): void => {
  const raw = JSON.stringify(data);
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // storage unavailable — ignore
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // storage unavailable — ignore
  }
};

export const loadPkce = (): PkceData | null => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PkceData) : null;
  } catch {
    return null;
  }
};

export const clearPkce = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable — ignore
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable — ignore
  }
};
