// ── Change Password ───────────────────────────────────

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface IChangePasswordResponse {
  message: string;
}

// ── Reset Password Providers ──────────────────────────

export type TResetProvider = "email" | "sms" | "email-otp";

export enum EResetStep {
  Send = 0,
  Validate = 1,
  Reset = 2,
  Success = 3,
}

// ── Send Reset ────────────────────────────────────────

export interface ISendResetRequest {
  identifier: string;
}

export interface ISendResetEmailResponse {
  message: string;
}

export interface ISendResetSmsResponse {
  message: string;
  maskedOtp: string;
  expiresInMinutes: number;
  currentAttempts: number;
  maxAttempts: number;
}

export interface ISendResetEmailOtpResponse {
  message: string;
  expiresInMinutes: number;
  currentAttempts: number;
  maxAttempts: number;
}

export type TSendResetResponse =
  | ISendResetEmailResponse
  | ISendResetSmsResponse
  | ISendResetEmailOtpResponse;

// ── Validate OTP ──────────────────────────────────────

export interface IValidateOtpRequest {
  identifier: string;
  otpCode: string;
}

export interface IValidateOtpResponse {
  message: string;
  passwordToken: string;
  tokenExpiresInMinutes: number;
}

// ── Complete Reset ────────────────────────────────────

export interface ICompleteResetRequest {
  passwordToken: string;
  newPassword: string;
  reNewPassword: string;
}

export interface ICompleteResetResponse {
  message: string;
}
