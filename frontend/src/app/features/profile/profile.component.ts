import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { ProgressService } from '../../core/services/progress.service';
import { TranslationService } from '../../core/services/translation.service';
import { UserProfile, BorrowingItem, UserFavoriteItem } from '../../core/models/user.model';
import { ReadingProgress, ReadingHistory } from '../../core/models/comic.model';

export interface AchievementBadge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  translationService = inject(TranslationService);
  private userProfileService = inject(UserProfileService);
  private progressService = inject(ProgressService);
  private router = inject(Router);

  activeTab = signal<'reading' | 'loans' | 'favorites' | 'settings'>('reading');
  loading = signal<boolean>(true);

  profile = signal<UserProfile | null>(null);
  borrowings = signal<BorrowingItem[]>([]);
  favorites = signal<UserFavoriteItem[]>([]);
  continueList = signal<ReadingProgress[]>([]);
  historyList = signal<ReadingHistory[]>([]);

  // Phase 7: Reading Streak & Gamification
  readingStreak = signal<number>(5);

  badges = computed<AchievementBadge[]>(() => {
    const loans = this.borrowings().length;
    const history = this.historyList().length;
    const favs = this.favorites().length;

    return [
      { id: 'first_read', icon: '🥇', name: 'First Read', desc: 'Read your first chapter', unlocked: history >= 1 },
      { id: 'streak_master', icon: '🔥', name: 'Streak Master', desc: 'Maintained a 5-day active streak', unlocked: this.readingStreak() >= 5 },
      { id: 'comic_buff', icon: '⚡', name: 'Super Reader', desc: 'Read multiple comic chapters', unlocked: history >= 2 },
      { id: 'collector', icon: '⭐', name: 'Top Curator', desc: 'Added favorite comics to collection', unlocked: favs >= 1 },
      { id: 'library_patron', icon: '📚', name: 'Library Patron', desc: 'Circulated physical books from desk', unlocked: loans >= 1 },
      { id: 'scholar', icon: '🎓', name: 'Grand Scholar', desc: 'Mastered both digital & print reading', unlocked: history >= 1 && loans >= 1 },
    ];
  });

  // Profile Edit
  editFirstName = signal<string>('');
  editLastName = signal<string>('');
  editPhone = signal<string>('');
  savingProfile = signal<boolean>(false);
  profileSuccess = signal<string>('');
  profileError = signal<string>('');

  // Password Change
  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  changingPassword = signal<boolean>(false);
  passwordSuccess = signal<string>('');
  passwordError = signal<string>('');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    this.userProfileService.getProfile().subscribe({
      next: (prof) => {
        this.profile.set(prof);
        this.editFirstName.set(prof.firstName || '');
        this.editLastName.set(prof.lastName || '');
        this.editPhone.set(prof.phone || '');
        this.loading.set(false);

        // Load reading progress with user's ID
        this.progressService.getContinueReading(prof.userId).subscribe({
          next: (res) => this.continueList.set(res),
        });

        this.progressService.getRecentHistory(prof.userId).subscribe({
          next: (res) => this.historyList.set(res),
        });
      },
      error: () => {
        this.loading.set(false);
      },
    });

    this.userProfileService.getBorrowings().subscribe({
      next: (loans) => this.borrowings.set(loans),
    });

    this.userProfileService.getFavorites().subscribe({
      next: (favs) => this.favorites.set(favs),
    });
  }

  setTab(tab: 'reading' | 'loans' | 'favorites' | 'settings') {
    this.activeTab.set(tab);
  }

  onSaveProfile() {
    this.profileSuccess.set('');
    this.profileError.set('');
    this.savingProfile.set(true);

    this.userProfileService
      .updateProfile({
        firstName: this.editFirstName(),
        lastName: this.editLastName(),
        phone: this.editPhone() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.authService.updateCurrentUser({
            name: `${updated.firstName} ${updated.lastName}`,
            phone: updated.phone,
          });
          this.savingProfile.set(false);
          this.profileSuccess.set('Profile successfully updated!');
        },
        error: (err) => {
          this.savingProfile.set(false);
          this.profileError.set(err.error?.message || 'Failed to update profile.');
        },
      });
  }

  onChangePassword() {
    this.passwordSuccess.set('');
    this.passwordError.set('');

    if (!this.currentPassword() || !this.newPassword()) {
      this.passwordError.set('Please fill out all password fields.');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.changingPassword.set(true);
    this.userProfileService
      .changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
      })
      .subscribe({
        next: () => {
          this.changingPassword.set(false);
          this.passwordSuccess.set('Password changed successfully!');
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
        },
        error: (err) => {
          this.changingPassword.set(false);
          this.passwordError.set(err.error?.message || 'Password update failed.');
        },
      });
  }

  removeFavorite(comicId: number) {
    this.userProfileService.removeFavorite(comicId).subscribe({
      next: () => {
        this.favorites.set(this.favorites().filter((f) => f.comic.comicId !== comicId));
        if (this.profile()) {
          const current = this.profile()!;
          this.profile.set({
            ...current,
            stats: {
              ...current.stats,
              favoritesCount: Math.max(0, current.stats.favoritesCount - 1),
            },
          });
        }
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
