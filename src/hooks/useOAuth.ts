"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  IOAuthAuthorizeParams,
  IOAuthAuthorizeResponse,
  IOAuthTokenResponse,
  IOAuthUserInfoResponse,
  IOIDCDiscoveryResponse,
} from "@/types/oauth.types";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "@/utils/pkce.util";

interface OAuthState {
  authorizeData: IOAuthAuthorizeResponse | null;
  tokenData: IOAuthTokenResponse | null;
  userInfoData: IOAuthUserInfoResponse | null;
  discovery: IOIDCDiscoveryResponse | null;
  codeVerifier: string | null;
  oauthState: string | null;
}

interface UseOAuthReturn {
  state: OAuthState;
  loading: boolean;
  fetchDiscovery: () => Promise<void>;
  initiateAuthorize: (params: {
    clientId: string;
    redirectUri: string;
    scope: string;
  }) => Promise<string | null>;
  exchangeCode: (code: string, returnedState: string) => Promise<void>;
  fetchUserInfo: (accessToken: string) => Promise<void>;
  revokeToken: (token: string, typeHint?: string) => Promise<void>;
}

const STORAGE_KEY = "oauth_pkce";

export const useOAuth = (): UseOAuthReturn => {
  const [oauthState, setOAuthState] = useState<OAuthState>({
    authorizeData: null,
    tokenData: null,
    userInfoData: null,
    discovery: null,
    codeVerifier: null,
    oauthState: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchDiscovery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/oauth/.well-known/openid-configuration");
      const data = await res.json();
      if (data) {
        setOAuthState((s) => ({ ...s, discovery: data.data || data }));
      }
    } catch {
      toast.error("Failed to fetch discovery config");
    } finally {
      setLoading(false);
    }
  }, []);

  const initiateAuthorize = useCallback(
    async (params: {
      clientId: string;
      redirectUri: string;
      scope: string;
    }): Promise<string | null> => {
      setLoading(true);
      try {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateState();

        // Store PKCE data in sessionStorage for callback
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            codeVerifier,
            state,
            redirectUri: params.redirectUri,
          }),
        );

        setOAuthState((s) => ({ ...s, codeVerifier, oauthState: state }));

        const query = new URLSearchParams({
          client_id: params.clientId,
          response_type: "code",
          redirect_uri: params.redirectUri,
          scope: params.scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        });

        // Build the authorize URL that will redirect through our API proxy
        const authorizeUrl = `/api/oauth/authorize?${query.toString()}`;

        // We return the URL so the page can use it
        // The actual redirect will be handled by the IAM Techno backend (302)
        const res = await fetch(authorizeUrl, { redirect: "manual" });

        if (res.status === 302) {
          const location = res.headers.get("location");
          if (location) {
            setOAuthState((s) => ({ ...s, authorizeData: null }));
            return location;
          }
        }

        const data = await res.json();
        if (data.status && data.data) {
          setOAuthState((s) => ({ ...s, authorizeData: data.data }));
          return data.data.authenticationEndpoint
            ? `${data.data.authenticationEndpoint}?session_id=${data.data.sessionId}&client_id=${data.data.clientId}`
            : null;
        }

        toast.error(data.message || "Authorize failed");
        return null;
      } catch {
        toast.error("Authorize failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const exchangeCode = useCallback(
    async (code: string, returnedState: string) => {
      setLoading(true);
      try {
        // Retrieve stored PKCE data
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) {
          toast.error("PKCE session expired. Please restart the flow.");
          return;
        }

        const { codeVerifier, state: storedState } = JSON.parse(stored);
        if (returnedState !== storedState) {
          toast.error("State mismatch — possible CSRF attack");
          return;
        }

        sessionStorage.removeItem(STORAGE_KEY);

        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("code_verifier", codeVerifier);
        params.append("client_id", ""); // Will be added by backend based on tenant

        const res = await fetch("/api/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        const data = await res.json();
        if (data.status && data.data) {
          setOAuthState((s) => ({ ...s, tokenData: data.data }));
          toast.success("Token exchange successful");
        } else {
          toast.error(data.message || "Token exchange failed");
        }
      } catch {
        toast.error("Token exchange failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchUserInfo = useCallback(async (accessToken: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/oauth/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.status && data.data) {
        setOAuthState((s) => ({ ...s, userInfoData: data.data }));
      } else {
        toast.error(data.message || "UserInfo failed");
      }
    } catch {
      toast.error("UserInfo request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeToken = useCallback(async (token: string, typeHint?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("token", token);
      if (typeHint) params.append("token_type_hint", typeHint);

      const res = await fetch("/api/oauth/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const data = await res.json();
      if (data.message) {
        toast.success("Token revoked");
      }
    } catch {
      toast.error("Revoke failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    state: oauthState,
    loading,
    fetchDiscovery,
    initiateAuthorize,
    exchangeCode,
    fetchUserInfo,
    revokeToken,
  };
};
