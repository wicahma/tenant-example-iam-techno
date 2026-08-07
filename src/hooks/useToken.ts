"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { apiRefreshToken, apiValidateTokens } from "@/services/auth.service";
import { getToken } from "@/utils/cookie.util";
import {
  IRefreshTokenResponse,
  IValidateTokensResponse,
  ITokens,
} from "@/types/auth.types";

interface UseTokenReturn {
  tokens: ITokens | null;
  refreshing: boolean;
  validating: boolean;
  lastRefresh: IRefreshTokenResponse | null;
  tokenStatus: IValidateTokensResponse | null;
  loadTokens: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  validateTokens: () => Promise<boolean>;
}

export const useToken = (): UseTokenReturn => {
  const [tokens, setTokens] = useState<ITokens | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<IRefreshTokenResponse | null>(
    null,
  );
  const [tokenStatus, setTokenStatus] =
    useState<IValidateTokensResponse | null>(null);

  const loadTokens = useCallback(async () => {
    const t = await getToken();
    setTokens(t);
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const current = await getToken();
    if (!current?.refreshToken) {
      toast.error("No refresh token found — please log in again");
      return false;
    }

    setRefreshing(true);
    try {
      const data = await apiRefreshToken({
        refreshToken: current.refreshToken,
      });

      if (data.status && data.data) {
        setLastRefresh(data.data);
        toast.success("Access token refreshed");
        await loadTokens();
        return true;
      }

      toast.error(data.message || "Token refresh failed");
      return false;
    } catch {
      toast.error("Network error during token refresh");
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [loadTokens]);

  const validateTokens = useCallback(async (): Promise<boolean> => {
    const current = await getToken();
    if (!current?.accessToken || !current?.refreshToken) {
      toast.error("Tokens not found — please log in again");
      return false;
    }

    setValidating(true);
    try {
      const data = await apiValidateTokens({
        accessToken: current.accessToken,
        refreshToken: current.refreshToken,
      });

      if (data.status && data.data) {
        setTokenStatus(data.data);
        const accessOk = data.data.accessToken.isValid;
        const refreshOk = data.data.refreshToken.isValid;
        if (accessOk && refreshOk) {
          toast.success("Both tokens are valid");
        } else {
          toast.error(
            accessOk
              ? "Refresh token is invalid or expired"
              : refreshOk
                ? "Access token is invalid or expired"
                : "Both tokens are invalid or expired",
          );
        }
        return true;
      }

      toast.error(data.message || "Token validation failed");
      return false;
    } catch {
      toast.error("Network error during token validation");
      return false;
    } finally {
      setValidating(false);
    }
  }, []);

  return {
    tokens,
    refreshing,
    validating,
    lastRefresh,
    tokenStatus,
    loadTokens,
    refreshToken,
    validateTokens,
  };
};
