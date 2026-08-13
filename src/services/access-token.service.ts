"use server";

import { oauthClient } from "@/config/api.config";

export interface IAccessTokenVerifyResponse {
  valid: boolean;
  tenantId?: number | null;
  productId?: number | null;
  error?: string | null;
  remaining?: number | null;
}

interface IAccessTokenVerifyEnvelope {
  status?: boolean;
  message?: string;
  data?: IAccessTokenVerifyResponse;
}

// POST /public/access-token/verify
// Validates a ba-token (AES-encrypted access token issued by the admin console).
// The backend enforces the tenant→product quota and returns the remaining count.

export const apiVerifyAccessToken = async (
  token: string,
): Promise<IAccessTokenVerifyResponse> => {
  const res = await oauthClient.post<IAccessTokenVerifyEnvelope>(
    "/public/access-token/verify",
    { token },
  );
  const body =
    res.data?.data ?? (res.data as unknown as IAccessTokenVerifyResponse);
  return body;
};
