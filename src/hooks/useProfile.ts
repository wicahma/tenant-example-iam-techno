"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { IUserDetail, IUpdateProfileRequest } from "@/types/auth.types";

interface UseProfileReturn {
  profile: IUserDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (body: IUpdateProfileRequest) => Promise<boolean>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<IUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/me");
      const data = await res.json();

      if (data.status) {
        setProfile(data.data);
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (body: IUpdateProfileRequest): Promise<boolean> => {
      try {
        const res = await fetch("/api/public/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (data.status) {
          toast.success("Profile updated");
          await fetchProfile();
          return true;
        } else {
          toast.error(data.message || "Failed to update profile");
          return false;
        }
      } catch {
        toast.error("Network error");
        return false;
      }
    },
    [fetchProfile],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refresh: fetchProfile, updateProfile };
};
