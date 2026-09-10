export interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  roleId: number;
  roleName: 'ADMIN' | 'LIBRARIAN' | 'MEMBER';
  membershipNo: string;
  phone?: string | null;
  status?: string;
  createdAt?: string;
}

export interface UserStats {
  activeLoansCount: number;
  favoritesCount: number;
  comicsReadCount: number;
  inProgressCount: number;
  unpaidFinesTotal: number;
}

export interface UserProfile extends User {
  stats: UserStats;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface BorrowingItem {
  borrowingId: number;
  bookTitle: string;
  bookCover?: string;
  barcode: string;
  shelfLocation: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  isOverdue: boolean;
  daysRemaining: number;
  fine?: {
    amount: number;
    paidAmount: number;
    paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED';
    notes?: string;
  } | null;
}

export interface UserFavoriteItem {
  favoriteId: number;
  createdAt: string;
  comic: any;
}
