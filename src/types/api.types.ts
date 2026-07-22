export interface APIBaseResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  pagination?: IPagination;
  metadata?: Record<string, unknown>;
}

export interface IPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}
