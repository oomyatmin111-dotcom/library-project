import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: Date;
}

export interface QuickPrompt {
  label: string;
  prompt: string;
}

export interface DialogueMatch {
  pageId: number;
  issueId: number;
  issueTitle: string;
  comicTitle: string;
  comicSlug: string;
  pageNumber: number;
  imageUrl: string;
  transcript: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/ai';

  chat(prompt: string, contextType: string = 'LORE', comicId?: number, issueId?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat`, {
      prompt,
      contextType,
      comicId,
      issueId,
    });
  }

  getQuickPrompts(): Observable<QuickPrompt[]> {
    return this.http.get<QuickPrompt[]>(`${this.apiUrl}/quick-prompts`);
  }

  searchDialogue(query: string): Observable<DialogueMatch[]> {
    return this.http.get<DialogueMatch[]>(`${this.apiUrl}/dialogue-search?q=${encodeURIComponent(query)}`);
  }
}
