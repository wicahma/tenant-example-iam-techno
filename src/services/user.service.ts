"use server";

import { publicClient } from "@/config/api.config";
import { APIBaseResponse } from "@/types/api.types";
import { IGetUsersParams, IUserListItem } from "@/types/user.types";

const BASE = "/public";

// ── GET /public/users ─────────────────────────────────

export const apiGetUsers = async (
  params: IGetUsersParams = {},
): Promise<APIBaseResponse<IUserListItem[]>> => {
  const res = await publicClient.get<APIBaseResponse<IUserListItem[]>>(
    `${BASE}/users`,
    {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.search && { search: params.search }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        ...(params.appId && { appId: params.appId }),
      },
    },
  );
  return res.data;
};
