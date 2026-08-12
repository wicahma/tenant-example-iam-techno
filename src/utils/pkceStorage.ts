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
  // The code_verifier is the credential-equivalent for the token exchange, so keep it
  // OUT of localStorage (readable by any XSS). sessionStorage is cloned into a popup
  // opened from this tab, so the callback page can still read the verifier.
  const { codeVerifier, ...shared } = data;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...shared, codeVerifier }),
    );
  } catch {
    // storage unavailable — ignore
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shared));
  } catch {
    // storage unavailable — ignore
  }
};

export const loadPkce = (): PkceData | null => {
  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
    const localRaw = localStorage.getItem(STORAGE_KEY);
    if (!sessionRaw && !localRaw) return null;
    // Prefer sessionStorage (holds the verifier); localStorage only carries state/redirectUri.
    const parsed = JSON.parse(sessionRaw ?? localRaw!) as PkceData;
    if (sessionRaw && localRaw) {
      const local = JSON.parse(localRaw) as PkceData;
      return { ...local, ...parsed };
    }
    return parsed;
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
