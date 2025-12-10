import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import type { AuthUser } from '../model/auth-user';
import type { AuthResponse } from '../model/auth-response';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'auth_user';

  readonly token = signal<string | null>(null);
  readonly currentUser = signal<AuthUser | null>(null);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      let localToken = localStorage.getItem(AuthService.TOKEN_KEY);
      let localUser = localStorage.getItem(AuthService.USER_KEY);

      this.token.set(localToken);
      this.currentUser.set(localUser ? JSON.parse(localUser) : {});
    }
  }

  isAuthenticated(): boolean { return !!this.token(); }
  role(): string | null { return this.currentUser()?.role ?? null; }
  isAdmin(): boolean { return this.role() === "admin"; }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap((res) => { this.setToken(res.token); this.setUser(res.user); })
    );
  }

  register(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, { email, password }).pipe(
      tap((res) => { this.setToken(res.token); this.setUser(res.user); })
    );
  }

  logout(): void { this.setToken(null); this.setUser(null); }

  private setToken(token: string | null): void {
    this.token.set(token);
    if (typeof localStorage === 'undefined') return;
    if (token) localStorage.setItem(AuthService.TOKEN_KEY, token);
    else localStorage.removeItem(AuthService.TOKEN_KEY);
  }

  private setUser(user: AuthUser | null) {
    this.currentUser.set(user);
    if (typeof localStorage === 'undefined') return;
    if (user) localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(AuthService.USER_KEY);
  }
}
