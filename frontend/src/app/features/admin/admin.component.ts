import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ComicService } from '../../core/services/comic.service';
import { CirculationService, BorrowingLoan, CirculationFine, BookReservation } from '../../core/services/circulation.service';
import { TranslationService } from '../../core/services/translation.service';
import { Comic } from '../../core/models/comic.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private comicService = inject(ComicService);
  private circService = inject(CirculationService);
  translationService = inject(TranslationService);

  stats = signal<any>(null);
  analytics = signal<any>(null);
  comics = signal<Comic[]>([]);
  activeTab = signal<'dashboard' | 'comics' | 'add-comic' | 'bulk-upload' | 'circulation' | 'fines' | 'reservations' | 'analytics'>('dashboard');
  exportingCsv = signal<boolean>(false);

  // Circulation Desk Signals
  loans = signal<BorrowingLoan[]>([]);
  fines = signal<CirculationFine[]>([]);
  reservations = signal<BookReservation[]>([]);
  checkoutBarcode = signal<string>('BC-CC-002');
  checkoutMember = signal<string>('MBR-2026-001');
  checkoutDays = signal<number>(14);
  checkinBarcode = signal<string>('BC-REF-001');
  checkinCondition = signal<string>('Good condition');
  loanFilter = signal<string>('ALL');
  fineFilter = signal<string>('ALL');
  loanSearch = signal<string>('');
  isCircLoading = signal<boolean>(false);

  // New Comic Form
  newComic = {
    title: '',
    universeId: 1,
    creator: '',
    description: '',
    coverImage: '',
    bannerImage: '',
    releaseYear: 2024,
    type: 'COMIC',
    status: 'ONGOING',
    isPopular: true,
  };

  // Bulk Chapter & Pages Uploader Form
  uploadComicId = signal<number>(1);
  uploadIssueNumber = signal<number>(2);
  uploadIssueTitle = signal<string>('Chapter 2: The Return');
  uploadReleaseDate = signal<string>('2026-09-10');
  rawImageUrls = signal<string>(
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000\nhttps://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=1000\nhttps://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000\nhttps://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000',
  );
  isUploading = signal<boolean>(false);
  uploadedIssueId = signal<number | null>(null);

  notification = signal<string | null>(null);

  parsedImageUrls = computed(() => {
    return this.rawImageUrls()
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  });

  ngOnInit() {
    this.loadStats();
    this.loadComics();
  }

  loadStats() {
    this.adminService.getStats().subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => console.error('Error fetching admin stats', err),
    });
  }

  loadComics() {
    this.comicService.getComics().subscribe({
      next: (data) => this.comics.set(data),
    });
  }

  onSubmitComic() {
    if (!this.newComic.title || !this.newComic.coverImage) {
      alert('Please fill Title and Cover Image URL');
      return;
    }

    this.adminService.createComic(this.newComic as any).subscribe({
      next: () => {
        this.showToast('✅ New Comic successfully created!');
        this.loadComics();
        this.loadStats();
        this.activeTab.set('comics');
        // Reset
        this.newComic.title = '';
        this.newComic.description = '';
        this.newComic.coverImage = '';
      },
      error: (err) => {
        console.error('Error creating comic', err);
        alert('Failed to create comic');
      },
    });
  }

  deleteComic(id: number) {
    if (confirm('Are you sure you want to delete this comic and all its issues?')) {
      this.adminService.deleteComic(id).subscribe({
        next: () => {
          this.showToast('🗑️ Comic deleted successfully');
          this.loadComics();
          this.loadStats();
        },
      });
    }
  }

  onBulkUpload() {
    const urls = this.parsedImageUrls();
    if (!this.uploadIssueTitle() || urls.length === 0) {
      alert('Please provide an issue title and at least one image URL');
      return;
    }

    this.isUploading.set(true);
    this.adminService
      .createIssueBulk({
        comicId: Number(this.uploadComicId()),
        issueNumber: Number(this.uploadIssueNumber()),
        title: this.uploadIssueTitle(),
        releaseDate: this.uploadReleaseDate() || undefined,
        imageUrls: urls,
      })
      .subscribe({
        next: (res) => {
          this.isUploading.set(false);
          this.uploadedIssueId.set(res.issueId);
          this.showToast(`🎉 Successfully ingested Chapter with ${urls.length} high-res pages!`);
          this.loadStats();
        },
        error: (err) => {
          this.isUploading.set(false);
          alert(err.error?.message || 'Failed to upload chapter and pages.');
        },
      });
  }

  quickFillDemoPages() {
    const sampleBatch = [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000',
      'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=1000',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000',
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=1000',
    ];
    this.rawImageUrls.set(sampleBatch.join('\n'));
  }

  showToast(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(null), 4000);
  }

  filteredLoans = computed(() => {
    const list = this.loans();
    const f = this.loanFilter();
    const s = this.loanSearch().toLowerCase().trim();
    return list.filter((loan) => {
      const matchFilter = f === 'ALL' || loan.status === f;
      const matchSearch =
        !s ||
        (loan.bookCopy?.barcode?.toLowerCase().includes(s) ?? false) ||
        (loan.bookCopy?.book?.title?.toLowerCase().includes(s) ?? false) ||
        (loan.user?.membershipNo?.toLowerCase().includes(s) ?? false) ||
        (loan.user?.firstName?.toLowerCase().includes(s) ?? false);
      return matchFilter && matchSearch;
    });
  });

  loadCirculationData() {
    this.isCircLoading.set(true);
    this.circService.getLoans().subscribe({
      next: (loans) => {
        this.loans.set(loans);
        this.isCircLoading.set(false);
      },
      error: () => this.isCircLoading.set(false),
    });

    this.circService.getFines().subscribe({
      next: (fines) => this.fines.set(fines),
    });

    this.circService.getReservations().subscribe({
      next: (res) => this.reservations.set(res),
    });
  }

  onCheckout() {
    const barcode = this.checkoutBarcode().trim();
    const member = this.checkoutMember().trim();
    if (!barcode || !member) {
      alert('Please enter both copy barcode and member number.');
      return;
    }

    this.circService.checkout(barcode, member, this.checkoutDays()).subscribe({
      next: (loan) => {
        this.showToast(`✅ Book checked out successfully to ${loan.user?.firstName || member}!`);
        this.loadCirculationData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to check out copy.');
      },
    });
  }

  onCheckin(barcodeToReturn?: string) {
    const barcode = (barcodeToReturn || this.checkinBarcode()).trim();
    if (!barcode) {
      alert('Please enter a barcode to return.');
      return;
    }

    this.circService.checkin(barcode, this.checkinCondition()).subscribe({
      next: (res) => {
        let msg = `📗 ${res.message || 'Book returned successfully.'}`;
        if (res.overdueDays > 0) {
          msg += ` ⚠️ Overdue by ${res.overdueDays} day(s). Fine of $${res.fine?.amount || '0.00'} generated!`;
        }
        if (res.reservedFor) {
          msg += ` 🔔 Copy reserved for ${res.reservedFor.firstName}!`;
        }
        this.showToast(msg);
        this.loadCirculationData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to return book copy.');
      },
    });
  }

  onPayFine(fineId: number, amount?: number) {
    this.circService.payFine(fineId, amount).subscribe({
      next: () => {
        this.showToast('💵 Fine payment recorded successfully!');
        this.loadCirculationData();
      },
      error: (err) => alert(err.error?.message || 'Failed to record fine payment.'),
    });
  }

  onWaiveFine(fineId: number) {
    const reason = prompt('Enter waiver reason (e.g. Medical or staff exception):', 'Librarian courtesy waiver');
    if (reason === null) return;

    this.circService.waiveFine(fineId, reason).subscribe({
      next: () => {
        this.showToast('🛡️ Fine waived successfully.');
        this.loadCirculationData();
      },
      error: (err) => alert(err.error?.message || 'Failed to waive fine.'),
    });
  }

  onCancelReservation(id: number) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    this.circService.cancelReservation(id).subscribe({
      next: () => {
        this.showToast('Reservation cancelled.');
        this.loadCirculationData();
      },
      error: (err) => alert(err.error?.message || 'Failed to cancel reservation.'),
    });
  }

  loadAnalytics() {
    this.adminService.getAnalytics().subscribe({
      next: (data) => this.analytics.set(data),
      error: (err) => console.error('Failed to load executive analytics', err),
    });
  }

  onExportCsv() {
    this.exportingCsv.set(true);
    this.adminService.downloadCirculationCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `circulation_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportingCsv.set(false);
        this.showToast('📥 Circulation report CSV downloaded!');
      },
      error: (err) => {
        this.exportingCsv.set(false);
        alert('Failed to export CSV report');
      },
    });
  }

  setTab(tab: 'dashboard' | 'comics' | 'add-comic' | 'bulk-upload' | 'circulation' | 'fines' | 'reservations' | 'analytics') {
    this.activeTab.set(tab);
    this.uploadedIssueId.set(null);
    if (tab === 'circulation' || tab === 'fines' || tab === 'reservations') {
      this.loadCirculationData();
    } else if (tab === 'analytics') {
      this.loadAnalytics();
    }
  }
}

