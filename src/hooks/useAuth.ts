"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { ILoginRequest } from "@/types/auth.types";

interface UseAuthReturn {
  login: (
    body: ILoginRequest,
    usernameSource?: string,
    responseType?: string,
  ) => Promise<boolean>;
  logout: () => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(
    async (
      body: ILoginRequest,
      usernameSource: string = "npk,email",
      responseType: string = "default",
    ): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch("/api/public/manual/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-username-source": usernameSource,
            "x-response-type": responseType,
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.status) {
          setIsAuthenticated(true);
          toast.success(data.message || "Login successful");
          return true;
        } else {
          toast.error(data.message || "Login failed");
          return false;
        }
      } catch {
        toast.error("Network error during login");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch("/api/public/logout", { method: "POST" });
      const data = await res.json();

      if (data.status) {
        setIsAuthenticated(false);
        toast.success("Logged out");
        return true;
      }
      return false;
    } catch {
      toast.error("Logout failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, logout, loading, isAuthenticated };
};
