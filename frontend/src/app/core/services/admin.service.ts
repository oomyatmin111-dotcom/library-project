import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comic } from '../models/comic.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/stats`);
  }

  createComic(data: Partial<Comic>): Observable<Comic> {
    return this.http.post<Comic>(`${this.apiUrl}/comics`, data);
  }

  deleteComic(comicId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comics/${comicId}`);
  }

  createIssue(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/issues`, data);
  }

  addPages(issueId: number, imageUrls: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/issues/${issueId}/pages`, { imageUrls });
  }

  createIssueBulk(data: {
    comicId: number;
    issueNumber: number;
    title: string;
    releaseDate?: string;
    coverImage?: string;
    imageUrls: string[];
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/issues/bulk`, data);
  }

  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/analytics`);
  }

  downloadCirculationCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/circulation/export-csv`, {
      responseType: 'blob',
    });
  }
}

