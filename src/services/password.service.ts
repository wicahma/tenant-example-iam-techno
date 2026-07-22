"use server";

import { publicClient } from "@/config/api.config";
import { APIBaseResponse } from "@/types/api.types";
import {
  IChangePasswordRequest,
  IChangePasswordResponse,
  ISendResetRequest,
  TSendResetResponse,
  IValidateOtpRequest,
  IValidateOtpResponse,
  ICompleteResetRequest,
  ICompleteResetResponse,
  TResetProvider,
} from "@/types/password.types";

const BASE = "/public";

// ── POST /public/me/change-password ───────────────────

export const apiChangePassword = async (
  body: IChangePasswordRequest,
): Promise<APIBaseResponse<IChangePasswordResponse>> => {
  const res = await publicClient.post<APIBaseResponse<IChangePasswordResponse>>(
    `${BASE}/me/change-password`,
    body,
  );
  return res.data;
};

// ── POST /public/reset-password ───────────────────────

export const apiSendResetPassword = async (
  body: ISendResetRequest,
  provider: TResetProvider,
  resetPath?: string,
): Promise<APIBaseResponse<TSendResetResponse>> => {
  const headers: Record<string, string> = {
    "x-reset-provider": provider,
  };
  if (resetPath) {
    headers["x-reset-path"] = resetPath;
  }

  const res = await publicClient.post<APIBaseResponse<TSendResetResponse>>(
    `${BASE}/reset-password`,
    body,
    { headers },
  );
  return res.data;
};

// ── POST /public/reset-password/validate ──────────────

export const apiValidateOtp = async (
  body: IValidateOtpRequest,
  provider: Extract<TResetProvider, "sms" | "email-otp">,
): Promise<APIBaseResponse<IValidateOtpResponse>> => {
  const res = await publicClient.post<APIBaseResponse<IValidateOtpResponse>>(
    `${BASE}/reset-password/validate`,
    body,
    {
      headers: { "x-reset-provider": provider },
    },
  );
  return res.data;
};

// ── POST /public/reset-password/reset ─────────────────

export const apiCompleteReset = async (
  body: ICompleteResetRequest,
  provider?: TResetProvider,
  passwordType?: string,
): Promise<APIBaseResponse<ICompleteResetResponse>> => {
  const headers: Record<string, string> = {};
  if (provider) headers["x-reset-provider"] = provider;
  if (passwordType) headers["x-password-type"] = passwordType;

  const res = await publicClient.post<APIBaseResponse<ICompleteResetResponse>>(
    `${BASE}/reset-password/reset`,
    body,
    { headers },
  );
  return res.data;
};
