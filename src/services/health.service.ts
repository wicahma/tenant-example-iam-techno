"use server";

import { oauthClient } from "@/config/api.config";

interface IHealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

// GET /public/health

export const apiHealthCheck = async (): Promise<IHealthResponse> => {
  const res = await oauthClient.get<IHealthResponse>("/public/health");
  return res.data;
};
