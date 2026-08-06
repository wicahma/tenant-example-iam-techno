"use server";

import { oauthClient, publicClient } from "@/config/api.config";
import { APIBaseResponse } from "@/types/api.types";
import {
  IOAuthAuthorizeParams,
  IOAuthAuthorizeResponse,
  IOAuthAuthorizeResult,
  IOAuthTokenRequest,
  IOAuthTokenResponse,
  IOAuthUserInfoResponse,
  IOIDCDiscoveryResponse,
} from "@/types/oauth.types";

const BASE = "/public";
// GET /public/oauth/authorize

export const apiOAuthAuthorize = async (
  params: IOAuthAuthorizeParams,
): Promise<IOAuthAuthorizeResult> => {
  const res = await oauthClient.get<APIBaseResponse<IOAuthAuthorizeResponse>>(
    `${BASE}/oauth/authorize`,
    {
      params,
      maxRedirects: 0,
      validateStatus: (status) => status === 200 || status === 302,
    },
  );
  return {
    status: res.status,
    location: res.headers.location as string | undefined,
    data: res.data,
  };
};

//  POST /public/oauth/token

export const apiOAuthToken = async (
  body: IOAuthTokenRequest,
): Promise<APIBaseResponse<IOAuthTokenResponse>> => {
  const params = new URLSearchParams();
  params.append("grant_type", body.grant_type);
  if (body.code) params.append("code", body.code);
  if (body.code_verifier) params.append("code_verifier", body.code_verifier);
  if (body.refresh_token) params.append("refresh_token", body.refresh_token);
  if (body.client_id) params.append("client_id", body.client_id);
  if (body.redirect_uri) params.append("redirect_uri", body.redirect_uri);
  if (body.scope) params.append("scope", body.scope);

  const res = await oauthClient.post<APIBaseResponse<IOAuthTokenResponse>>(
    `${BASE}/oauth/token`,
    params.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return res.data;
};

//  GET /public/oauth/userinfo

export const apiOAuthUserInfo = async (
  accessToken: string,
): Promise<APIBaseResponse<IOAuthUserInfoResponse>> => {
  const res = await oauthClient.get<APIBaseResponse<IOAuthUserInfoResponse>>(
    `${BASE}/oauth/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  return res.data;
};

//  GET /public/.well-known/openid-configuration ─

export const apiOIDCDiscovery = async (): Promise<
  APIBaseResponse<IOIDCDiscoveryResponse>
> => {
  const res = await oauthClient.get<APIBaseResponse<IOIDCDiscoveryResponse>>(
    `${BASE}/.well-known/openid-configuration`,
  );
  return res.data;
};

//  POST /public/oauth/revoke

export const apiOAuthRevoke = async (
  token: string,
  tokenTypeHint?: "access_token" | "refresh_token",
): Promise<APIBaseResponse<{ message: string }>> => {
  const params = new URLSearchParams();
  params.append("token", token);
  if (tokenTypeHint) params.append("token_type_hint", tokenTypeHint);

  const res = await oauthClient.post<APIBaseResponse<{ message: string }>>(
    `${BASE}/oauth/revoke`,
    params.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return res.data;
};

//  POST /public/oauth/login

export const apiOAuthLogin = async (body: {
  identifier: string;
  password: string;
  sessionId: string;
}): Promise<
  APIBaseResponse<{
    redirectUri: string;
    code: string;
    state: string;
  }>
> => {
  const res = await publicClient.post(`${BASE}/oauth/login`, body);
  return res.data;
};
