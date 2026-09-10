import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { AuthService } from '../../core/services/auth.service';
import { Issue, IssuePage } from '../../core/models/comic.model';

export type ReadingMode = 'single' | 'double' | 'webtoon';
export type ReadingDirection = 'ltr' | 'rtl';
export type ReaderTheme = 'dark' | 'sepia' | 'light';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css'],
})
export class ReaderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private progressService = inject(ProgressService);
  authService = inject(AuthService);

  issue = signal<Issue | null>(null);
  pages = signal<IssuePage[]>([]);
  currentPage = signal<number>(1);
  readingMode = signal<ReadingMode>('single');
  direction = signal<ReadingDirection>('ltr');
  readerTheme = signal<ReaderTheme>('dark');
  brightness = signal<number>(100);
  zoomLevel = signal<number>(1);
  syncedPercent = signal<number>(0);
  showControls = signal<boolean>(true);
  isSettingsOpen = signal<boolean>(false);
  loading = signal<boolean>(true);

  // Preloaded image URLs cache
  private preloadedUrls = new Set<string>();

  ngOnInit() {
    this.loadStoredPreferences();

    this.route.paramMap.subscribe((params) => {
      const issueId = Number(params.get('issueId'));
      const queryPage = Number(this.route.snapshot.queryParamMap.get('page')) || 1;

      if (issueId) {
        this.loadIssue(issueId, queryPage);
      }
    });
  }

  private loadStoredPreferences() {
    try {
      const raw = localStorage.getItem('comic_reader_preferences');
      if (raw) {
        const pref = JSON.parse(raw);
        if (pref.readingMode) this.readingMode.set(pref.readingMode);
        if (pref.direction) this.direction.set(pref.direction);
        if (pref.readerTheme) this.readerTheme.set(pref.readerTheme);
        if (pref.brightness) this.brightness.set(pref.brightness);
      }
    } catch {}
  }

  private savePreferences() {
    try {
      const pref = {
        readingMode: this.readingMode(),
        direction: this.direction(),
        readerTheme: this.readerTheme(),
        brightness: this.brightness(),
      };
      localStorage.setItem('comic_reader_preferences', JSON.stringify(pref));
    } catch {}
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

        // Preload adjacent pages
        this.preloadAdjacentPages();
        this.syncProgressToBackend();
      },
      error: (err) => {
        console.error('Failed to load issue', err);
        this.loading.set(false);
      },
    });
  }

  // Preloads next and previous pages in browser in-memory cache
  private preloadAdjacentPages() {
    const p = this.pages();
    if (!p || p.length === 0) return;

    const cur = this.currentPage();
    const indicesToPreload = [cur + 1, cur + 2, cur + 3, cur - 1].filter(
      (idx) => idx >= 1 && idx <= this.totalPages,
    );

    indicesToPreload.forEach((pageNum) => {
      const pageObj = p.find((item) => item.pageNumber === pageNum);
      if (pageObj && pageObj.imageUrl && !this.preloadedUrls.has(pageObj.imageUrl)) {
        const img = new Image();
        img.src = pageObj.imageUrl;
        this.preloadedUrls.add(pageObj.imageUrl);
      }
    });
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

  // Double-page spread facing pages
  getDoublePages(): { left: IssuePage | null; right: IssuePage | null; isCover: boolean } {
    const p = this.pages();
    const cur = this.currentPage();

    // If Page 1, treat as solo cover in double mode
    if (cur === 1) {
      const coverPage = p.find((x) => x.pageNumber === 1) || null;
      return { left: null, right: coverPage, isCover: true };
    }

    // Normal facing pair: e.g. pages 2 & 3, 4 & 5
    const firstPageNum = cur % 2 === 0 ? cur : cur - 1;
    const pageA = p.find((x) => x.pageNumber === firstPageNum) || null;
    const pageB = p.find((x) => x.pageNumber === firstPageNum + 1) || null;

    if (this.direction() === 'rtl') {
      // In RTL (Manga), first page is on the right, subsequent page is on the left
      return { left: pageB, right: pageA, isCover: false };
    } else {
      // LTR (Western), first page on left, next on right
      return { left: pageA, right: pageB, isCover: false };
    }
  }

  nextPage() {
    const step = this.readingMode() === 'double' && this.currentPage() > 1 ? 2 : 1;
    if (this.currentPage() < this.totalPages) {
      const next = Math.min(this.totalPages, this.currentPage() + step);
      this.currentPage.set(next);
      this.preloadAdjacentPages();
      this.syncProgressToBackend();
    }
  }

  prevPage() {
    const step = this.readingMode() === 'double' && this.currentPage() > 2 ? 2 : 1;
    if (this.currentPage() > 1) {
      const prev = Math.max(1, this.currentPage() - step);
      this.currentPage.set(prev);
      this.preloadAdjacentPages();
      this.syncProgressToBackend();
    }
  }

  jumpToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages)));
    this.preloadAdjacentPages();
    this.syncProgressToBackend();
  }

  syncProgressToBackend() {
    const iss = this.issue();
    if (!iss) return;

    const percent = Math.min(100, Math.round((this.currentPage() / this.totalPages) * 100));
    this.syncedPercent.set(percent);

    const userId = this.authService.currentUser()?.userId || 2;

    this.progressService
      .syncProgress({
        userId,
        comicId: iss.comicId,
        issueId: iss.issueId,
        pageNumber: this.currentPage(),
      })
      .subscribe({
        error: (err) => console.error('Error syncing progress', err),
      });
  }

  setMode(mode: ReadingMode) {
    this.readingMode.set(mode);
    this.savePreferences();
  }

  setDirection(dir: ReadingDirection) {
    this.direction.set(dir);
    this.savePreferences();
  }

  setTheme(theme: ReaderTheme) {
    this.readerTheme.set(theme);
    this.savePreferences();
  }

  updateBrightness(val: number) {
    this.brightness.set(val);
    this.savePreferences();
  }

  toggleSettings() {
    this.isSettingsOpen.set(!this.isSettingsOpen());
  }

  toggleControls() {
    this.showControls.set(!this.showControls());
  }

  zoomIn() {
    this.zoomLevel.update((z) => Math.min(2.0, +(z + 0.15).toFixed(2)));
  }

  zoomOut() {
    this.zoomLevel.update((z) => Math.max(0.6, +(z - 0.15).toFixed(2)));
  }

  resetZoom() {
    this.zoomLevel.set(1);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (this.readingMode() === 'webtoon') return;

    const isRtl = this.direction() === 'rtl';

    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      if (isRtl) this.prevPage();
      else this.nextPage();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      if (isRtl) this.nextPage();
      else this.prevPage();
    } else if (event.key === ' ') {
      this.nextPage();
    } else if (event.key === 'f' || event.key === 'F') {
      this.toggleFullscreen();
    }
  }
}
