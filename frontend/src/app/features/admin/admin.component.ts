import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ComicService } from '../../core/services/comic.service';
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

  stats = signal<any>(null);
  comics = signal<Comic[]>([]);
  activeTab = signal<'dashboard' | 'comics' | 'add-comic'>('dashboard');

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

  notification = signal<string | null>(null);

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

  showToast(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(null), 3000);
  }

  setTab(tab: 'dashboard' | 'comics' | 'add-comic') {
    this.activeTab.set(tab);
  }
}
