import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { Issue, IssuePage } from '../../core/models/comic.model';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css'],
})
export class ReaderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private progressService = inject(ProgressService);

  issue = signal<Issue | null>(null);
  pages = signal<IssuePage[]>([]);
  currentPage = signal<number>(1);
  readingMode = signal<'single' | 'scroll'>('single');
  zoomLevel = signal<number>(1);
  syncedPercent = signal<number>(0);
  showControls = signal<boolean>(true);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const issueId = Number(params.get('issueId'));
      const queryPage = Number(this.route.snapshot.queryParamMap.get('page')) || 1;

      if (issueId) {
        this.loadIssue(issueId, queryPage);
      }
    });
  }

  loadIssue(issueId: number, startPage: number) {
    this.loading.set(true);
    this.progressService.getIssue(issueId).subscribe({
      next: (data) => {
        this.issue.set(data);
        const p = data.pages || [];
        this.pages.set(p);
        this.currentPage.set(Math.min(startPage, Math.max(1, p.length)));
        this.loading.set(false);

        // Sync initial page
        this.syncProgressToBackend();
      },
      error: (err) => {
        console.error('Failed to load issue', err);
        this.loading.set(false);
      },
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update((p) => p + 1);
      this.syncProgressToBackend();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.syncProgressToBackend();
    }
  }

  jumpToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages)));
    this.syncProgressToBackend();
  }

  get totalPages(): number {
    return this.pages().length || this.issue()?.totalPages || 1;
  }

  get currentImage(): string {
    const pageObj = this.pages().find((p) => p.pageNumber === this.currentPage());
    if (pageObj) return pageObj.imageUrl;
    if (this.pages().length > 0) return this.pages()[0].imageUrl;
    return this.issue()?.coverImage || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000';
  }

  syncProgressToBackend() {
    const iss = this.issue();
    if (!iss) return;

    const percent = Math.min(100, Math.round((this.currentPage() / this.totalPages) * 100));
    this.syncedPercent.set(percent);

    this.progressService
      .syncProgress({
        userId: 2,
        comicId: iss.comicId,
        issueId: iss.issueId,
        pageNumber: this.currentPage(),
      })
      .subscribe({
        next: (res) => {
          // Progress updated
        },
        error: (err) => console.error('Error syncing progress', err),
      });
  }

  setMode(mode: 'single' | 'scroll') {
    this.readingMode.set(mode);
  }

  zoomIn() {
    this.zoomLevel.update((z) => Math.min(1.8, +(z + 0.15).toFixed(2)));
  }

  zoomOut() {
    this.zoomLevel.update((z) => Math.max(0.7, +(z - 0.15).toFixed(2)));
  }

  resetZoom() {
    this.zoomLevel.set(1);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (this.readingMode() === 'single') {
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        this.nextPage();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        this.prevPage();
      }
    }
  }
}
