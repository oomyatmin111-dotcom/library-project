import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  currentUser = signal<User | null>(this.getStoredUser());
  isLoggedIn = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.roleName || null);
  isAdmin = computed(() => this.currentUser()?.roleName === 'ADMIN');
  isLibrarian = computed(() => this.currentUser()?.roleName === 'LIBRARIAN' || this.isAdmin());

  isAuthModalOpen = signal<boolean>(false);
  authModalMode = signal<'login' | 'register'>('login');

  constructor() {
    // If not logged in, auto-restore or fetch demo user if none exists
    if (!this.currentUser()) {
      this.initDefaultUser();
    }
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem('library_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('library_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('library_refresh_token');
  }

  private saveSession(resp: AuthResponse) {
    localStorage.setItem('library_access_token', resp.accessToken);
    localStorage.setItem('library_refresh_token', resp.refreshToken);
    localStorage.setItem('library_user', JSON.stringify(resp.user));
    this.currentUser.set(resp.user);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((resp) => {
        this.saveSession(resp);
        this.closeAuthModal();
      }),
    );
  }

  register(data: { firstName: string; lastName: string; email: string; password: string; phone?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((resp) => {
        this.saveSession(resp);
        this.closeAuthModal();
      }),
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((resp) => {
        this.saveSession(resp);
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      }),
    );
  }

  logout() {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        error: () => {},
      });
    }

    localStorage.removeItem('library_access_token');
    localStorage.removeItem('library_refresh_token');
    localStorage.removeItem('library_user');
    this.currentUser.set(null);
  }

  getDemoUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/demo-users`);
  }

  quickDemoLogin(email: string): Observable<AuthResponse> {
    return this.login({ email, password: 'Password@123' });
  }

  updateCurrentUser(user: Partial<User>) {
    const current = this.currentUser();
    if (current) {
      const updated = { ...current, ...user };
      localStorage.setItem('library_user', JSON.stringify(updated));
      this.currentUser.set(updated);
    }
  }

  openAuthModal(mode: 'login' | 'register' = 'login') {
    this.authModalMode.set(mode);
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal() {
    this.isAuthModalOpen.set(false);
  }

  private initDefaultUser() {
    // Check if demo user can be preloaded for convenience
    this.http.get<any[]>(`${this.apiUrl}/demo-users`).subscribe({
      next: (users) => {
        const member = users.find((u: any) => u.roleId === 3) || users[0];
        if (member && !this.getToken()) {
          // Pre-authenticate as member for seamless experience
          this.quickDemoLogin(member.email).subscribe({
            error: () => {},
          });
        }
      },
      error: () => {},
    });
  }
}
