"use server";

import { publicClient } from "@/config/api.config";
import { APIBaseResponse } from "@/types/api.types";
import {
  IUserDetail,
  IUserProfile,
  IUpdateProfileRequest,
  IUpdateProfileResponse,
} from "@/types/auth.types";

const BASE = "/public";

// GET /public/me
export const apiGetMe = async (): Promise<APIBaseResponse<IUserDetail>> => {
  const res = await publicClient.get<APIBaseResponse<IUserDetail>>(
    `${BASE}/me`,
  );
  return res.data;
};

// GET /public/me/profile
export const apiGetProfile = async (): Promise<
  APIBaseResponse<IUserProfile>
> => {
  const res = await publicClient.get<APIBaseResponse<IUserProfile>>(
    `${BASE}/me/profile`,
  );
  return res.data;
};

// PUT /public/me
export const apiUpdateProfile = async (
  body: IUpdateProfileRequest,
): Promise<APIBaseResponse<IUpdateProfileResponse>> => {
  const res = await publicClient.put<APIBaseResponse<IUpdateProfileResponse>>(
    `${BASE}/me`,
    body,
  );
  return res.data;
};
