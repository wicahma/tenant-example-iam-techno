"use client";

import { useState } from "react";
import {
  apiVerifyAccessToken,
  IAccessTokenVerifyResponse,
} from "@/services/access-token.service";

export function useAccessToken() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<IAccessTokenVerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiVerifyAccessToken(token.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifikasi token gagal");
    } finally {
      setLoading(false);
    }
  };

  return { token, setToken, verify, result, loading, error };
}
