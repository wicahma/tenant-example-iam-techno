"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { IUserListItem, IGetUsersParams } from "@/types/user.types";
import { IPagination } from "@/types/api.types";

interface UseUsersReturn {
  users: IUserListItem[];
  pagination: IPagination | null;
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  fetchUsers: (params?: IGetUsersParams) => Promise<void>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<IUserListItem[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async (params?: IGetUsersParams) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.search) query.set("search", params.search);
      if (params?.isActive !== undefined)
        query.set("isActive", String(params.isActive));

      const qs = query.toString();
      const res = await fetch(`/api/public/users${qs ? `?${qs}` : ""}`);
      const data = await res.json();

      if (data.status) {
        setUsers(data.data || []);
        setPagination(data.pagination || null);
      } else {
        toast.error(data.message || "Failed to fetch users");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { users, pagination, loading, search, setSearch, fetchUsers };
};
