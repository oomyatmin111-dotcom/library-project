import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comic, Universe } from '../models/comic.model';

@Injectable({
  providedIn: 'root',
})
export class ComicService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getComics(filter?: {
    universe?: string;
    type?: string;
    popular?: boolean;
    trending?: boolean;
    search?: string;
  }): Observable<Comic[]> {
    let params = new HttpParams();
    if (filter?.universe) params = params.set('universe', filter.universe);
    if (filter?.type) params = params.set('type', filter.type);
    if (filter?.popular) params = params.set('popular', 'true');
    if (filter?.trending) params = params.set('trending', 'true');
    if (filter?.search) params = params.set('search', filter.search);

    return this.http.get<Comic[]>(`${this.apiUrl}/comics`, { params });
  }

  getFeaturedComic(): Observable<Comic> {
    return this.http.get<Comic>(`${this.apiUrl}/comics/featured`);
  }

  getComicBySlug(slugOrId: string): Observable<Comic> {
    return this.http.get<Comic>(`${this.apiUrl}/comics/${slugOrId}`);
  }

  getUniverses(): Observable<Universe[]> {
    return this.http.get<Universe[]>(`${this.apiUrl}/comics/universes`);
  }
}
