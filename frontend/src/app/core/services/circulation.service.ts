import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BorrowingLoan {
  borrowingId: number;
  userId: number;
  copyId: number;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  user?: {
    userId: number;
    firstName: string;
    lastName: string;
    membershipNo: string;
    email: string;
    phone?: string;
  };
  bookCopy?: {
    copyId: number;
    barcode: string;
    status: string;
    conditionNote?: string;
    book?: {
      bookId: number;
      title: string;
      isbn: string;
      coverImage?: string;
      shelfLocation?: string;
    };
  };
  fine?: {
    fineId: number;
    amount: number;
    paidAmount: number;
    paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED';
    notes?: string;
  };
}

export interface CirculationFine {
  fineId: number;
  borrowingId: number;
  amount: number;
  paidAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  borrowings?: BorrowingLoan;
}

export interface BookReservation {
  reservationId: number;
  bookId: number;
  userId: number;
  reservationDate: string;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  book?: {
    bookId: number;
    title: string;
    isbn: string;
    coverImage?: string;
  };
  user?: {
    userId: number;
    firstName: string;
    lastName: string;
    membershipNo: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CirculationService {
  private http = inject(HttpClient);
  private apiUrl = '/api/circulation';

  checkout(barcode: string, memberIdentifier: string, durationDays = 14): Observable<BorrowingLoan> {
    return this.http.post<BorrowingLoan>(`${this.apiUrl}/checkout`, {
      barcode,
      memberIdentifier,
      durationDays,
    });
  }

  checkin(barcode: string, conditionNote?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkin`, {
      barcode,
      conditionNote,
    });
  }

  getLoans(params?: { status?: string; search?: string; userId?: number }): Observable<BorrowingLoan[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.userId) httpParams = httpParams.set('userId', params.userId.toString());

    return this.http.get<BorrowingLoan[]>(`${this.apiUrl}/loans`, { params: httpParams });
  }

  getFines(status?: string): Observable<CirculationFine[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<CirculationFine[]>(`${this.apiUrl}/fines`, { params });
  }

  payFine(fineId: number, amount?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/fines/${fineId}/pay`, { amount });
  }

  waiveFine(fineId: number, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/fines/${fineId}/waive`, { notes });
  }

  getReservations(bookId?: number, userId?: number): Observable<BookReservation[]> {
    let params = new HttpParams();
    if (bookId) params = params.set('bookId', bookId.toString());
    if (userId) params = params.set('userId', userId.toString());
    return this.http.get<BookReservation[]>(`${this.apiUrl}/reservations`, { params });
  }

  createReservation(bookId: number): Observable<BookReservation> {
    return this.http.post<BookReservation>(`${this.apiUrl}/reservations`, { bookId });
  }

  cancelReservation(reservationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reservations/${reservationId}`);
  }
}
