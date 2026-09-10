import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ComicService } from '../../core/services/comic.service';
import { ProgressService } from '../../core/services/progress.service';
import { Comic, ReadingProgress, Universe } from '../../core/models/comic.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
  private comicService = inject(ComicService);
  private progressService = inject(ProgressService);
  private route = inject(ActivatedRoute);

  featuredComic = signal<Comic | null>(null);
  comics = signal<Comic[]>([]);
  continueReading = signal<ReadingProgress[]>([]);
  universes = signal<Universe[]>([]);

  activeUniverse = signal<string>('all');
  activeFilter = signal<'all' | 'popular' | 'trending' | 'ebook'>('all');
  heroUniverse = signal<'dc' | 'marvel'>('dc');

  // Phase 5 Search & Faceted Filtering
  searchQuery = signal<string>('');
  sortBy = signal<'views' | 'newest' | 'title'>('views');
  statusFilter = signal<string>('ALL');

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['universe']) {
        this.activeUniverse.set(params['universe']);
      } else if (params['type'] === 'ebook') {
        this.activeFilter.set('ebook');
      } else {
        this.activeUniverse.set('all');
      }
      this.loadComics();
    });

    this.loadFeatured();
    this.loadContinueReading();
    this.loadUniverses();
  }

  loadFeatured() {
    this.comicService.getFeaturedComic().subscribe({
      next: (comic) => this.featuredComic.set(comic),
      error: (err) => console.error('Error fetching featured comic', err),
    });
  }

  loadContinueReading() {
    this.progressService.getContinueReading(2).subscribe({
      next: (list) => this.continueReading.set(list),
      error: (err) => console.error('Error fetching progress', err),
    });
  }

  loadUniverses() {
    this.comicService.getUniverses().subscribe({
      next: (u) => this.universes.set(u),
    });
  }

  loadComics() {
    const filter: any = {};
    if (this.activeUniverse() !== 'all') {
      filter.universe = this.activeUniverse();
    }
    if (this.activeFilter() === 'popular') {
      filter.popular = true;
    } else if (this.activeFilter() === 'trending') {
      filter.trending = true;
    } else if (this.activeFilter() === 'ebook') {
      filter.type = 'EBOOK';
    }

    if (this.searchQuery().trim()) {
      filter.search = this.searchQuery().trim();
    }

    if (this.statusFilter() !== 'ALL') {
      filter.status = this.statusFilter();
    }

    if (this.sortBy() !== 'views') {
      filter.sort = this.sortBy();
    }

    this.comicService.getComics(filter).subscribe({
      next: (data) => this.comics.set(data),
      error: (err) => console.error('Error loading comics', err),
    });
  }

  onSearchInput(val: string) {
    this.searchQuery.set(val);
    this.loadComics();
  }

  onSortChange(val: any) {
    this.sortBy.set(val);
    this.loadComics();
  }

  onStatusChange(val: any) {
    this.statusFilter.set(val);
    this.loadComics();
  }

  setUniverse(slug: string) {
    this.activeUniverse.set(slug);
    this.loadComics();
  }

  setFilter(filter: 'all' | 'popular' | 'trending' | 'ebook') {
    this.activeFilter.set(filter);
    this.loadComics();
  }

  toggleHeroUniverse(u: 'dc' | 'marvel') {
    this.heroUniverse.set(u);
  }
}
