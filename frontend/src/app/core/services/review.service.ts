import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserReview {
  reviewId: number;
  userId: number;
  comicId?: number;
  bookId?: number;
  rating: number;
  reviewTitle?: string;
  reviewText: string;
  hasSpoilers: boolean;
  createdAt: string;
  user?: {
    userId: number;
    firstName: string;
    lastName: string;
    membershipNo: string;
  };
}

export interface ReviewListResponse {
  reviews: UserReview[];
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private http = inject(HttpClient);

  getReviews(params: { comicId?: number; bookId?: number }): Observable<ReviewListResponse> {
    let httpParams = new HttpParams();
    if (params.comicId) httpParams = httpParams.set('comic_id', params.comicId.toString());
    if (params.bookId) httpParams = httpParams.set('book_id', params.bookId.toString());
    return this.http.get<ReviewListResponse>('/api/reviews', { params: httpParams });
  }

  addOrUpdateReview(dto: {
    comic_id?: number;
    book_id?: number;
    rating: number;
    review_title?: string;
    review_text: string;
    has_spoilers?: boolean;
  }): Observable<UserReview> {
    return this.http.post<UserReview>('/api/reviews', dto);
  }

  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(`/api/reviews/${reviewId}`);
  }

  getRecommendations(idOrSlug: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/comics/${idOrSlug}/recommendations`);
  }
}
