import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ComicService } from '../../core/services/comic.service';
import { ProgressService } from '../../core/services/progress.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { ReviewService, ReviewListResponse } from '../../core/services/review.service';
import { Comic, ReadingProgress } from '../../core/models/comic.model';

@Component({
  selector: 'app-comic-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './comic-detail.component.html',
  styleUrls: ['./comic-detail.component.css'],
})
export class ComicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private comicService = inject(ComicService);
  private progressService = inject(ProgressService);
  authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private reviewService = inject(ReviewService);

  comic = signal<Comic | null>(null);
  userProgress = signal<ReadingProgress | null>(null);
  isFavorite = signal<boolean>(false);
  loading = signal(true);
  favoriteLoading = signal(false);

  // Phase 5 Social & Discovery Signals
  reviewsData = signal<ReviewListResponse | null>(null);
  recommendations = signal<Comic[]>([]);
  userRating = signal<number>(5);
  reviewTitle = signal<string>('');
  reviewText = signal<string>('');
  hasSpoilers = signal<boolean>(false);
  revealedSpoilers = signal<Set<number>>(new Set());
  isSubmittingReview = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadComic(slug);
      }
    });
  }

  loadComic(slug: string) {
    this.loading.set(true);
    this.comicService.getComicBySlug(slug).subscribe({
      next: (comic) => {
        this.comic.set(comic);
        this.loading.set(false);
        this.checkProgress(comic.comicId);
        this.checkFavoriteStatus(comic.comicId);
        this.loadReviews(comic.comicId);
        this.loadRecommendations(slug);
      },
      error: (err) => {
        console.error('Error loading comic detail', err);
        this.loading.set(false);
      },
    });
  }

  loadReviews(comicId: number) {
    this.reviewService.getReviews({ comicId }).subscribe({
      next: (res) => this.reviewsData.set(res),
      error: (err) => console.error('Error loading reviews:', err),
    });
  }

  loadRecommendations(slugOrId: string) {
    this.reviewService.getRecommendations(slugOrId).subscribe({
      next: (comics) => this.recommendations.set(comics),
      error: (err) => console.error('Error loading recommendations:', err),
    });
  }

  submitReview() {
    if (!this.authService.isLoggedIn()) {
      this.authService.openAuthModal('login');
      return;
    }

    const c = this.comic();
    if (!c) return;

    const text = this.reviewText().trim();
    if (!text) {
      alert('Please write your review thoughts.');
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewService
      .addOrUpdateReview({
        comic_id: c.comicId,
        rating: this.userRating(),
        review_title: this.reviewTitle().trim() || undefined,
        review_text: text,
        has_spoilers: this.hasSpoilers(),
      })
      .subscribe({
        next: () => {
          this.isSubmittingReview.set(false);
          this.reviewTitle.set('');
          this.reviewText.set('');
          this.hasSpoilers.set(false);
          this.loadReviews(c.comicId);
        },
        error: (err) => {
          this.isSubmittingReview.set(false);
          alert(err.error?.message || 'Failed to submit review.');
        },
      });
  }

  toggleSpoiler(reviewId: number) {
    const s = new Set(this.revealedSpoilers());
    if (s.has(reviewId)) {
      s.delete(reviewId);
    } else {
      s.add(reviewId);
    }
    this.revealedSpoilers.set(s);
  }

  deleteReview(reviewId: number) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        const c = this.comic();
        if (c) this.loadReviews(c.comicId);
      },
      error: (err) => alert(err.error?.message || 'Failed to delete review.'),
    });
  }

  checkProgress(comicId: number) {
    const userId = this.authService.currentUser()?.userId || 2;
    this.progressService.getContinueReading(userId).subscribe({
      next: (list) => {
        const found = list.find((p) => p.comicId === comicId);
        if (found) {
          this.userProgress.set(found);
        }
      },
    });
  }

  checkFavoriteStatus(comicId: number) {
    if (!this.authService.isLoggedIn()) {
      this.isFavorite.set(false);
      return;
    }

    this.userProfileService.checkFavorite(comicId).subscribe({
      next: (res) => {
        this.isFavorite.set(res.isFavorite);
      },
      error: () => {},
    });
  }

  toggleFavorite() {
    if (!this.authService.isLoggedIn()) {
      this.authService.openAuthModal('login');
      return;
    }

    const c = this.comic();
    if (!c) return;

    this.favoriteLoading.set(true);
    if (this.isFavorite()) {
      this.userProfileService.removeFavorite(c.comicId).subscribe({
        next: () => {
          this.isFavorite.set(false);
          this.favoriteLoading.set(false);
        },
        error: () => this.favoriteLoading.set(false),
      });
    } else {
      this.userProfileService.addFavorite(c.comicId).subscribe({
        next: () => {
          this.isFavorite.set(true);
          this.favoriteLoading.set(false);
        },
        error: () => this.favoriteLoading.set(false),
      });
    }
  }
}
