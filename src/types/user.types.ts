export interface IGetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  appId?: number;
}

export interface IUserListItem {
  id: number;
  npk: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string | null;
}
