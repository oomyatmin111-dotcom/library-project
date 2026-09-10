import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Annotation {
  annotationId: number;
  userId: number;
  issueId: number;
  pageNumber: number;
  note: string;
  color: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/annotations';

  getByIssue(issueId: number): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(`${this.apiUrl}/issue/${issueId}`);
  }

  create(issueId: number, pageNumber: number, note: string, color?: string): Observable<Annotation> {
    return this.http.post<Annotation>(this.apiUrl, {
      issueId,
      pageNumber,
      note,
      color,
    });
  }

  delete(annotationId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${annotationId}`);
  }
}
