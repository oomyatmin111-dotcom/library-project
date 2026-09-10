import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, BorrowingItem, UserFavoriteItem } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/users';

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  updateProfile(data: { firstName: string; lastName: string; phone?: string }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/me/password`, data);
  }

  getBorrowings(): Observable<BorrowingItem[]> {
    return this.http.get<BorrowingItem[]>(`${this.apiUrl}/me/borrowings`);
  }

  getFavorites(): Observable<UserFavoriteItem[]> {
    return this.http.get<UserFavoriteItem[]>(`${this.apiUrl}/me/favorites`);
  }

  addFavorite(comicId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/me/favorites/${comicId}`, {});
  }

  removeFavorite(comicId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/me/favorites/${comicId}`);
  }

  checkFavorite(comicId: number): Observable<{ isFavorite: boolean }> {
    return this.http.get<{ isFavorite: boolean }>(`${this.apiUrl}/me/favorites/check/${comicId}`);
  }
}
