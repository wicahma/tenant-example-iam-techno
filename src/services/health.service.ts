"use server";

import { oauthClient } from "@/config/api.config";
import { APIBaseResponse } from "@/types/api.types";

interface IHealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

// ── GET /public/health ────────────────────────────────

export const apiHealthCheck = async (): Promise<
  APIBaseResponse<IHealthResponse>
> => {
  const res =
    await oauthClient.get<APIBaseResponse<IHealthResponse>>("/public/health");
  return res.data;
};
