import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalComponent } from '../../../features/auth/auth-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, AuthModalComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  searchQuery = signal('');
  isMenuOpen = signal<boolean>(false);

  onSearch() {
    if (this.searchQuery().trim()) {
      this.router.navigate(['/'], { queryParams: { search: this.searchQuery() } });
    }
  }

  toggleMenu() {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  switchDemo(email: string) {
    this.authService.quickDemoLogin(email).subscribe({
      next: () => {
        this.closeMenu();
        // Refresh page or navigate
        this.router.navigate(['/profile']);
      },
    });
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
