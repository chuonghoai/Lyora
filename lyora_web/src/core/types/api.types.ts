export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta | null;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
  isNetworkError?: boolean;
}

export type UserRole = 'CLIENT' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  hometown?: string | null;
  workplace?: string | null;
  education?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  isActive?: boolean;
  isOnline?: boolean;
  lockReason?: string | null;
  lockedAt?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseData extends AuthTokens {
  user: UserProfile;
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'statusCode' in err &&
    'message' in err
  );
}

