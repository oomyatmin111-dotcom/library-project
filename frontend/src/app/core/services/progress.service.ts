import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ReadingProgress, ReadingHistory, Issue } from '../models/comic.model';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // Signals for reactive UI state
  continueReadingList = signal<ReadingProgress[]>([]);
  recentHistoryList = signal<ReadingHistory[]>([]);

  getContinueReading(userId: number = 2): Observable<ReadingProgress[]> {
    return this.http
      .get<ReadingProgress[]>(`${this.apiUrl}/progress/continue-reading?userId=${userId}`)
      .pipe(
        tap((items) => {
          this.continueReadingList.set(items);
        }),
      );
  }

  getRecentHistory(userId: number = 2): Observable<ReadingHistory[]> {
    return this.http
      .get<ReadingHistory[]>(`${this.apiUrl}/progress/history?userId=${userId}`)
      .pipe(
        tap((items) => {
          this.recentHistoryList.set(items);
        }),
      );
  }

  syncProgress(data: {
    userId?: number;
    comicId: number;
    issueId: number;
    pageNumber: number;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/progress/sync`, data);
  }

  getIssue(issueId: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/issues/${issueId}`);
  }
}
