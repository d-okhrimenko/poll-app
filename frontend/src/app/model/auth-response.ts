import type { AuthUser } from './auth-user';

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
