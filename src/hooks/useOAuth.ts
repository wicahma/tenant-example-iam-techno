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
  apiOIDCDiscovery,
  apiOAuthAuthorize,
  apiOAuthToken,
  apiOAuthUserInfo,
  apiOAuthRevoke,
} from "@/services/oauth.service";
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
  revokeToken: (
    token: string,
    typeHint?: "access_token" | "refresh_token",
  ) => Promise<void>;
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
      const data = await apiOIDCDiscovery();
      if (data) {
        const discovery = (data.data || data) as IOIDCDiscoveryResponse;
        setOAuthState((s) => ({ ...s, discovery }));
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

        const authorizeParams: IOAuthAuthorizeParams = {
          client_id: params.clientId,
          response_type: "code",
          redirect_uri: params.redirectUri,
          scope: params.scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        };

        // Call the backend authorize endpoint via the service layer.
        // The backend may 302-redirect to the login page; expose that location.
        const result = await apiOAuthAuthorize(authorizeParams);

        if (result.status === 302 && result.location) {
          setOAuthState((s) => ({ ...s, authorizeData: null }));
          return result.location;
        }

        const data = result.data;
        if (data.status && data.data) {
          setOAuthState((s) => ({ ...s, authorizeData: data.data ?? null }));
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

        const data = await apiOAuthToken({
          grant_type: "authorization_code",
          code,
          code_verifier: codeVerifier,
          client_id: "", // Will be added by backend based on tenant
        });

        if (data.status && data.data) {
          setOAuthState((s) => ({ ...s, tokenData: data.data ?? null }));
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
      const data = await apiOAuthUserInfo(accessToken);
      if (data.status && data.data) {
        setOAuthState((s) => ({ ...s, userInfoData: data.data ?? null }));
      } else {
        toast.error(data.message || "UserInfo failed");
      }
    } catch {
      toast.error("UserInfo request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeToken = useCallback(
    async (token: string, typeHint?: "access_token" | "refresh_token") => {
      setLoading(true);
      try {
        const data = await apiOAuthRevoke(token, typeHint);
        if (data.status) {
          toast.success("Token revoked");
        }
      } catch {
        toast.error("Revoke failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

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
