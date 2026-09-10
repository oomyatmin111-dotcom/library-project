import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { AuthService } from '../../core/services/auth.service';
import { OfflineStorageService } from '../../core/services/offline-storage.service';
import { AnnotationService, Annotation } from '../../core/services/annotation.service';
import { TranslationService } from '../../core/services/translation.service';
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
  private offlineService = inject(OfflineStorageService);
  private annotationService = inject(AnnotationService);
  authService = inject(AuthService);
  translationService = inject(TranslationService);

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

  // Phase 7: Offline & Annotations State
  isDownloaded = signal<boolean>(false);
  isDownloading = signal<boolean>(false);
  annotations = signal<Annotation[]>([]);
  isAnnotationModalOpen = signal<boolean>(false);
  isBookmarksDrawerOpen = signal<boolean>(false);
  newNoteText = signal<string>('');
  selectedNoteColor = signal<string>('#f59e0b');

  // Phase 9: Audio TTS Narrator
  isNarrating = signal<boolean>(false);
  speechRate = signal<number>(1.0);

  // Preloaded image URLs cache
  private preloadedUrls = new Set<string>();

  // Current page's annotations
  currentPageAnnotations = computed(() => {
    const p = this.currentPage();
    return this.annotations().filter((a) => a.pageNumber === p);
  });

  ngOnInit() {
    this.loadStoredPreferences();

    this.route.paramMap.subscribe((params) => {
      const issueId = Number(params.get('issueId'));
      const queryPage = Number(this.route.snapshot.queryParamMap.get('page')) || 1;

      if (issueId) {
        this.loadIssue(issueId, queryPage);
        this.checkOfflineStatus(issueId);
        this.loadAnnotations(issueId);
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

  async checkOfflineStatus(issueId: number) {
    const downloaded = await this.offlineService.isDownloaded(issueId);
    this.isDownloaded.set(downloaded);
  }

  loadAnnotations(issueId: number) {
    if (!this.authService.isLoggedIn()) return;
    this.annotationService.getByIssue(issueId).subscribe({
      next: (list) => this.annotations.set(list),
      error: () => {},
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

        this.preloadAdjacentPages();
        this.syncProgressToBackend();
      },
      error: async (err) => {
        console.warn('Network error, checking offline cache...', err);
        // Attempt to load from offline IndexedDB
        const offlineData = await this.offlineService.getIssue(issueId);
        if (offlineData) {
          const offlinePages: IssuePage[] = offlineData.pages.map((url, idx) => ({
            pageId: idx + 1,
            issueId,
            pageNumber: idx + 1,
            imageUrl: url,
            pageType: 'STORY',
          }));
          this.issue.set({
            issueId,
            comicId: 0,
            issueNumber: offlineData.issueNumber,
            title: `${offlineData.comicTitle} (Offline Mode)`,
            coverImage: offlinePages[0]?.imageUrl || '',
            totalPages: offlinePages.length,
            pages: offlinePages,
          });
          this.pages.set(offlinePages);
          this.currentPage.set(1);
          this.loading.set(false);
          this.isDownloaded.set(true);
        } else {
          this.loading.set(false);
        }
      },
    });
  }

  async downloadForOffline() {
    const iss = this.issue();
    if (!iss || this.isDownloading() || this.isDownloaded()) return;

    this.isDownloading.set(true);
    try {
      const pageUrls = this.pages().map((p) => p.imageUrl);
      await this.offlineService.saveIssue({
        issueId: iss.issueId,
        comicTitle: iss.comic?.title || 'Comic Series',
        issueNumber: iss.issueNumber,
        downloadDate: new Date().toISOString(),
        pages: pageUrls,
      });
      this.isDownloaded.set(true);
    } catch (err) {
      console.error('Failed to download issue for offline', err);
    } finally {
      this.isDownloading.set(false);
    }
  }

  openAnnotationModal() {
    this.newNoteText.set('');
    this.isAnnotationModalOpen.set(true);
  }

  closeAnnotationModal() {
    this.isAnnotationModalOpen.set(false);
  }

  saveAnnotation() {
    const iss = this.issue();
    const note = this.newNoteText().trim();
    if (!iss || !note) return;

    this.annotationService
      .create(iss.issueId, this.currentPage(), note, this.selectedNoteColor())
      .subscribe({
        next: (created) => {
          this.annotations.update((arr) => [...arr, created]);
          this.closeAnnotationModal();
        },
        error: (err) => console.error('Failed to save bookmark note', err),
      });
  }

  deleteAnnotation(annotationId: number) {
    this.annotationService.delete(annotationId).subscribe({
      next: () => {
        this.annotations.update((arr) => arr.filter((a) => a.annotationId !== annotationId));
      },
    });
  }

  toggleBookmarksDrawer() {
    this.isBookmarksDrawerOpen.set(!this.isBookmarksDrawerOpen());
  }

  jumpToBookmarkedPage(pageNumber: number) {
    this.jumpToPage(pageNumber);
    this.isBookmarksDrawerOpen.set(false);
  }

  // Preloads next and previous pages in browser in-memory cache
  private preloadAdjacentPages() {
    const cur = this.currentPage();
    const all = this.pages();
    const toPreload = [cur + 1, cur + 2, cur - 1].filter((p) => p >= 1 && p <= all.length);

    toPreload.forEach((pNum) => {
      const targetPage = all.find((p) => p.pageNumber === pNum);
      if (targetPage && !this.preloadedUrls.has(targetPage.imageUrl)) {
        const img = new Image();
        img.src = targetPage.imageUrl;
        this.preloadedUrls.add(targetPage.imageUrl);
      }
    });
  }

  get totalPages(): number {
    return this.pages().length || this.issue()?.totalPages || 1;
  }

  get currentPageData(): IssuePage | undefined {
    return this.pages().find((p) => p.pageNumber === this.currentPage());
  }

  toggleNarration() {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on your browser.');
      return;
    }

    if (this.isNarrating()) {
      window.speechSynthesis.cancel();
      this.isNarrating.set(false);
      return;
    }

    const curPage = this.currentPageData;
    const textToSpeak = (curPage as any)?.transcript ||
      `Reading ${this.issue()?.title || 'comic'}, page ${this.currentPage()} of ${this.totalPages}. Immerse yourself in the action panels.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = this.speechRate();
    utterance.pitch = 1.0;
    utterance.onend = () => this.isNarrating.set(false);
    utterance.onerror = () => this.isNarrating.set(false);

    window.speechSynthesis.cancel(); // Stop any pending
    window.speechSynthesis.speak(utterance);
    this.isNarrating.set(true);
  }

  get doubleSpreadData(): { left?: IssuePage; right?: IssuePage } {
    const cur = this.currentPage();
    const all = this.pages();

    if (this.direction() === 'rtl') {
      return {
        right: all.find((p) => p.pageNumber === cur),
        left: all.find((p) => p.pageNumber === cur + 1),
      };
    } else {
      return {
        left: all.find((p) => p.pageNumber === cur),
        right: all.find((p) => p.pageNumber === cur + 1),
      };
    }
  }

  prevPage() {
    const step = this.readingMode() === 'double' ? 2 : 1;
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => Math.max(1, p - step));
      this.preloadAdjacentPages();
      this.syncProgressToBackend();
    }
  }

  nextPage() {
    const step = this.readingMode() === 'double' ? 2 : 1;
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update((p) => Math.min(this.totalPages, p + step));
      this.preloadAdjacentPages();
      this.syncProgressToBackend();
    }
  }

  jumpToPage(pageNum: number) {
    const clamped = Math.max(1, Math.min(this.totalPages, pageNum));
    this.currentPage.set(clamped);
    this.preloadAdjacentPages();
    this.syncProgressToBackend();
  }

  private syncProgressToBackend() {
    const iss = this.issue();
    if (!iss) return;

    const percent = Math.round((this.currentPage() / this.totalPages) * 100);
    this.syncedPercent.set(percent);

    if (!this.authService.isLoggedIn()) return;

    this.progressService
      .syncProgress({
        comicId: iss.comicId,
        issueId: iss.issueId,
        pageNumber: this.currentPage(),
      })
      .subscribe({
        next: () => {},
        error: (err: any) => console.warn('Could not auto-sync reader progress', err),
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
