import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { AuthModalComponent } from '../../../features/auth/auth-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, AuthModalComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  translationService = inject(TranslationService);
  private router = inject(Router);

  searchQuery = signal('');
  isMenuOpen = signal<boolean>(false);
  isNotificationOpen = signal<boolean>(false);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.refreshNotifications();
    }
  }

  refreshNotifications() {
    this.notificationService.fetchNotifications().subscribe({
      error: () => {},
    });
  }

  toggleNotification() {
    this.isNotificationOpen.set(!this.isNotificationOpen());
    if (this.isNotificationOpen()) {
      this.isMenuOpen.set(false);
      this.refreshNotifications();
    }
  }

  closeNotification() {
    this.isNotificationOpen.set(false);
  }

  onNotificationClick(notif: AppNotification) {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.notificationId).subscribe();
    }
    this.closeNotification();
    if (notif.linkUrl) {
      this.router.navigateByUrl(notif.linkUrl);
    }
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe();
  }

  onSearch() {
    if (this.searchQuery().trim()) {
      this.router.navigate(['/'], { queryParams: { search: this.searchQuery() } });
    }
  }

  toggleMenu() {
    this.isMenuOpen.set(!this.isMenuOpen());
    if (this.isMenuOpen()) {
      this.isNotificationOpen.set(false);
    }
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  toggleLanguage() {
    this.translationService.toggleLanguage();
  }

  switchDemo(email: string) {
    this.authService.quickDemoLogin(email).subscribe({
      next: () => {
        this.closeMenu();
        this.refreshNotifications();
        this.router.navigate(['/profile']);
      },
    });
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
    this.isNotificationOpen.set(false);
    this.router.navigate(['/']);
  }
}
