import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  searchQuery = signal('');

  constructor(private router: Router) {}

  onSearch() {
    if (this.searchQuery().trim()) {
      this.router.navigate(['/'], { queryParams: { search: this.searchQuery() } });
    }
  }
}
