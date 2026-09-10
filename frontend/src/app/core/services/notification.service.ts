import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AppNotification {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: 'LOAN_DUE' | 'RESERVATION_READY' | 'NEW_ISSUE' | 'SYSTEM';
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/notifications';

  unreadCount = signal<number>(0);
  notifications = signal<AppNotification[]>([]);

  fetchNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl).pipe(
      tap((data) => {
        this.notifications.set(data);
        const unread = data.filter((n) => !n.isRead).length;
        this.unreadCount.set(unread);
      }),
    );
  }

  fetchUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).pipe(
      tap((res) => this.unreadCount.set(res.count)),
    );
  }

  markAsRead(notificationId: number): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        this.notifications.update((list) =>
          list.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n)),
        );
        this.unreadCount.update((count) => Math.max(0, count - 1));
      }),
    );
  }

  markAllAsRead(): Observable<{ success: boolean; affected: number }> {
    return this.http.patch<{ success: boolean; affected: number }>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      }),
    );
  }

  syncReminders(): Observable<{ created: number }> {
    return this.http.post<{ created: number }>(`${this.apiUrl}/sync-reminders`, {});
  }
}
