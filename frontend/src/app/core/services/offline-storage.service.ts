import { Injectable } from '@angular/core';

export interface OfflineIssue {
  issueId: number;
  comicTitle: string;
  issueNumber: number;
  downloadDate: string;
  pages: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private dbName = 'ComicReaderOfflineDB';
  private dbVersion = 1;
  private storeName = 'offline_issues';

  private async openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'issueId' });
        }
      };

      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async saveIssue(issue: OfflineIssue): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(issue);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getIssue(issueId: number): Promise<OfflineIssue | null> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(issueId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async isDownloaded(issueId: number): Promise<boolean> {
    const issue = await this.getIssue(issueId);
    return !!issue;
  }

  async deleteIssue(issueId: number): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(issueId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllDownloaded(): Promise<OfflineIssue[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
}
