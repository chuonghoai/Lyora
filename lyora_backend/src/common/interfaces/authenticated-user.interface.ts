import { UserRole } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}
