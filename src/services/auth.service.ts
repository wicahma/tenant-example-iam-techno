"use server";

import { publicClient } from "@/config/api.config";
import { APIBaseResponse } from "@/types/api.types";
import {
  ILoginRequest,
  ILoginResponse,
  IPreTokenClaimsRequest,
  IPreTokenResponse,
  IRefreshTokenRequest,
  IRefreshTokenResponse,
  IValidateTokenRequest,
  IValidateTokenResponse,
  ILogoutResponse,
  ITokens,
} from "@/types/auth.types";
import { setToken, clearToken } from "@/utils/cookie.util";

const BASE = "/public";

// ── POST /public/manual/login ─────────────────────────

export const apiManualLogin = async (
  body: ILoginRequest,
  usernameSource: string = "npk,email",
  responseType: string = "default",
): Promise<APIBaseResponse<ILoginResponse | IPreTokenResponse>> => {
  const res = await publicClient.post<
    APIBaseResponse<ILoginResponse | IPreTokenResponse>
  >(`${BASE}/manual/login`, body, {
    headers: {
      "x-username-source": usernameSource,
      "x-response-type": responseType,
    },
  });

  // Store tokens if default mode returned them
  if (res.data.status && res.data.data && "accessToken" in res.data.data) {
    const loginData = res.data.data as ILoginResponse;
    const tokens: ITokens = {
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken,
      fullName: loginData.fullName,
      email: loginData.email,
      npk: loginData.npk,
    };
    await setToken(tokens);
  }

  return res.data;
};

// ── POST /public/pre-token/claims ─────────────────────

export const apiPreTokenClaims = async (
  body: IPreTokenClaimsRequest,
): Promise<APIBaseResponse<ILoginResponse>> => {
  const res = await publicClient.post<APIBaseResponse<ILoginResponse>>(
    `${BASE}/pre-token/claims`,
    body,
  );

  if (res.data.status && res.data.data) {
    const loginData = res.data.data;
    const tokens: ITokens = {
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken,
      fullName: loginData.fullName,
      email: loginData.email,
      npk: loginData.npk,
    };
    await setToken(tokens);
  }

  return res.data;
};

// ── POST /public/logout ───────────────────────────────

export const apiLogout = async (): Promise<
  APIBaseResponse<ILogoutResponse>
> => {
  const res = await publicClient.post<APIBaseResponse<ILogoutResponse>>(
    `${BASE}/logout`,
  );
  await clearToken();
  return res.data;
};

// ── POST /public/me/refresh-token ─────────────────────

export const apiRefreshToken = async (
  body: IRefreshTokenRequest,
): Promise<APIBaseResponse<IRefreshTokenResponse>> => {
  const res = await publicClient.post<APIBaseResponse<IRefreshTokenResponse>>(
    `${BASE}/me/refresh-token`,
    body,
  );

  if (res.data.status && res.data.data) {
    const token = await import("@/utils/cookie.util").then((m) => m.getToken());
    if (token) {
      const updatedTokens: ITokens = {
        ...token,
        accessToken: res.data.data.accessToken,
        refreshToken: res.data.data.refreshToken,
      };
      await setToken(updatedTokens);
    }
  }

  return res.data;
};

// ── POST /public/validate-token ───────────────────────

export const apiValidateToken = async (
  body: IValidateTokenRequest,
): Promise<APIBaseResponse<IValidateTokenResponse>> => {
  const res = await publicClient.post<APIBaseResponse<IValidateTokenResponse>>(
    `${BASE}/validate-token`,
    body,
  );
  return res.data;
};
