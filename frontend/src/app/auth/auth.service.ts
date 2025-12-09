import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import type { AuthUser } from '../model/auth-user';
import type { AuthResponse } from '../model/auth-response';
import { environment } from '../../environments/environment';
import { roles } from "../model/roles";

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private static readonly STORAGE_KEY = 'auth_token';

  readonly token = signal<string | null>(typeof localStorage !== 'undefined' ? localStorage.getItem(AuthService.STORAGE_KEY) : null);
  readonly currentUser = signal<AuthUser | null>(null);

  isAuthenticated(): boolean { return !!this.token(); }
  role(): string | null { return this.currentUser()?.role ?? null; }
  isAdmin(): boolean { return this.role() === "admin"; }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap((res) => { this.setToken(res.token); this.currentUser.set(res.user); })
    );
  }

  register(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, { email, password }).pipe(
      tap((res) => { this.setToken(res.token); this.currentUser.set(res.user); })
    );
  }

  logout(): void { this.setToken(null); this.currentUser.set(null); }

  private setToken(token: string | null): void {
    this.token.set(token);
    if (typeof localStorage === 'undefined') return;
    if (token) localStorage.setItem(AuthService.STORAGE_KEY, token);
    else localStorage.removeItem(AuthService.STORAGE_KEY);
  }
}
