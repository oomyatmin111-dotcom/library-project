export interface Universe {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  accentColor: string;
  comicCount?: number;
}

export interface IssuePage {
  pageId: number;
  issueId: number;
  pageNumber: number;
  imageUrl: string;
}

export interface Issue {
  issueId: number;
  comicId: number;
  comic?: Comic;
  issueNumber: number;
  title: string;
  coverImage?: string;
  totalPages: number;
  fileUrl?: string;
  releaseDate?: string;
  pages?: IssuePage[];
}

export interface Comic {
  comicId: number;
  title: string;
  slug: string;
  universeId?: number;
  universe?: Universe;
  creator?: string;
  description?: string;
  coverImage: string;
  bannerImage?: string;
  releaseYear?: number;
  rating: number;
  viewsCount: number;
  isPopular: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  type: 'COMIC' | 'EBOOK';
  status: 'ONGOING' | 'COMPLETED';
  issues?: Issue[];
}

export interface ReadingProgress {
  progressId: number;
  userId: number;
  comicId: number;
  comic: Comic;
  lastIssueId: number;
  lastIssue: Issue;
  lastPageNumber: number;
  progressPercent: number;
  isCompleted: boolean;
  updatedAt: string;
}

export interface ReadingHistory {
  historyId: number;
  userId: number;
  comicId: number;
  comic: Comic;
  lastIssueId?: number;
  lastIssue?: Issue;
  readAt: string;
}
