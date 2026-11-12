import type { UserProfile } from '@/core';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

