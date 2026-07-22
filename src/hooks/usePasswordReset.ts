"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { TResetProvider, EResetStep } from "@/types/password.types";

interface ResetState {
  step: EResetStep;
  provider: TResetProvider;
  identifier: string;
  passwordToken: string;
  maskedOtp?: string;
  expiresInMinutes?: number;
  currentAttempts?: number;
  maxAttempts?: number;
}

interface UsePasswordResetReturn {
  state: ResetState;
  setProvider: (p: TResetProvider) => void;
  setIdentifier: (id: string) => void;
  sendReset: () => Promise<boolean>;
  validateOtp: (otpCode: string) => Promise<boolean>;
  completeReset: (
    newPassword: string,
    reNewPassword: string,
  ) => Promise<boolean>;
  loading: boolean;
  reset: () => void;
}

const initialState: ResetState = {
  step: EResetStep.Send,
  provider: "email",
  identifier: "",
  passwordToken: "",
};

export const usePasswordReset = (): UsePasswordResetReturn => {
  const [state, setState] = useState<ResetState>(initialState);
  const [loading, setLoading] = useState(false);

  const setProvider = useCallback((p: TResetProvider) => {
    setState((s) => ({ ...s, provider: p }));
  }, []);

  const setIdentifier = useCallback((id: string) => {
    setState((s) => ({ ...s, identifier: id }));
  }, []);

  const sendReset = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch("/api/public/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reset-provider": state.provider,
        },
        body: JSON.stringify({ identifier: state.identifier }),
      });
      const data = await res.json();

      if (data.status) {
        if (state.provider === "email") {
          toast.success("Reset email sent. Check your inbox.");
          // For email provider, the token comes via email link, so skip validation step
          setState((s) => ({
            ...s,
            step: EResetStep.Reset,
            passwordToken: "", // Will be filled when user clicks email link or enters manually
          }));
        } else {
          toast.success(data.data?.message || "OTP sent");
          setState((s) => ({
            ...s,
            step: EResetStep.Validate,
            maskedOtp: data.data?.maskedOtp,
            expiresInMinutes: data.data?.expiresInMinutes,
            currentAttempts: data.data?.currentAttempts,
            maxAttempts: data.data?.maxAttempts,
          }));
        }
        return true;
      } else {
        toast.error(data.message || "Failed to send reset");
        return false;
      }
    } catch {
      toast.error("Network error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.provider, state.identifier]);

  const validateOtp = useCallback(
    async (otpCode: string): Promise<boolean> => {
      setLoading(true);
      try {
        const provider = state.provider as Extract<
          TResetProvider,
          "sms" | "email-otp"
        >;
        const res = await fetch("/api/public/reset-password/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-reset-provider": provider,
          },
          body: JSON.stringify({ identifier: state.identifier, otpCode }),
        });
        const data = await res.json();

        if (data.status) {
          toast.success("OTP validated");
          setState((s) => ({
            ...s,
            step: EResetStep.Reset,
            passwordToken: data.data?.passwordToken || "",
          }));
          return true;
        } else {
          toast.error(data.message || "Invalid OTP");
          return false;
        }
      } catch {
        toast.error("Network error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [state.provider, state.identifier],
  );

  const completeReset = useCallback(
    async (newPassword: string, reNewPassword: string): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch("/api/public/reset-password/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-reset-provider": state.provider,
          },
          body: JSON.stringify({
            passwordToken: state.passwordToken,
            newPassword,
            reNewPassword,
          }),
        });
        const data = await res.json();

        if (data.status) {
          toast.success("Password reset successfully");
          setState((s) => ({ ...s, step: EResetStep.Success }));
          return true;
        } else {
          toast.error(data.message || "Failed to reset password");
          return false;
        }
      } catch {
        toast.error("Network error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [state.provider, state.passwordToken],
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setProvider,
    setIdentifier,
    sendReset,
    validateOtp,
    completeReset,
    loading,
    reset,
  };
};
