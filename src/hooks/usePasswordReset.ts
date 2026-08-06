"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  TResetProvider,
  EResetStep,
  ISendResetSmsResponse,
} from "@/types/password.types";
import {
  apiSendResetPassword,
  apiValidateOtp,
  apiCompleteReset,
} from "@/services/password.service";

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
  validateOtp: (otpCode: string) => Promise<string | null>;
  completeReset: (
    newPassword: string,
    reNewPassword: string,
    passwordToken?: string,
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
      const data = await apiSendResetPassword(
        { identifier: state.identifier },
        state.provider,
      );

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
          const resetData = data.data as ISendResetSmsResponse | undefined;
          setState((s) => ({
            ...s,
            step: EResetStep.Validate,
            maskedOtp: resetData?.maskedOtp,
            expiresInMinutes: resetData?.expiresInMinutes,
            currentAttempts: resetData?.currentAttempts,
            maxAttempts: resetData?.maxAttempts,
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
    async (otpCode: string): Promise<string | null> => {
      setLoading(true);
      try {
        const provider = state.provider as Extract<
          TResetProvider,
          "sms" | "email-otp"
        >;
        const data = await apiValidateOtp(
          { identifier: state.identifier, otpCode },
          provider,
        );

        console.log("Validate OTP Response:", data);
        console.log("Password Token:", data.data?.passwordToken);

        if (data.status) {
          toast.success("OTP validated");
          // Return the token directly — React state updates are async, so the
          // caller can't read `state.passwordToken` immediately after `await`.
          const token = data.data?.passwordToken || "";
          setState((s) => ({
            ...s,
            step: EResetStep.Reset,
            passwordToken: token,
          }));
          return token || null;
        } else {
          toast.error(data.message || "Invalid OTP");
          return null;
        }
      } catch {
        toast.error("Network error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [state.provider, state.identifier],
  );

  const completeReset = useCallback(
    async (
      newPassword: string,
      reNewPassword: string,
      passwordToken?: string,
    ): Promise<boolean> => {
      setLoading(true);
      try {
        const data = await apiCompleteReset(
          {
            // Prefer the explicit token (e.g., from the URL/input on the reset
            // page) over hook state, which is a separate hook instance there.
            passwordToken: passwordToken ?? state.passwordToken,
            newPassword,
            reNewPassword,
          },
          state.provider,
        );

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
