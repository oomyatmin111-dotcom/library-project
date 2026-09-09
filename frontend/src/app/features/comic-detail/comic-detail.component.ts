import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ComicService } from '../../core/services/comic.service';
import { ProgressService } from '../../core/services/progress.service';
import { Comic, ReadingProgress } from '../../core/models/comic.model';

@Component({
  selector: 'app-comic-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './comic-detail.component.html',
  styleUrls: ['./comic-detail.component.css'],
})
export class ComicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private comicService = inject(ComicService);
  private progressService = inject(ProgressService);

  comic = signal<Comic | null>(null);
  userProgress = signal<ReadingProgress | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadComic(slug);
      }
    });
  }

  loadComic(slug: string) {
    this.loading.set(true);
    this.comicService.getComicBySlug(slug).subscribe({
      next: (comic) => {
        this.comic.set(comic);
        this.loading.set(false);
        this.checkProgress(comic.comicId);
      },
      error: (err) => {
        console.error('Error loading comic detail', err);
        this.loading.set(false);
      },
    });
  }

  checkProgress(comicId: number) {
    this.progressService.getContinueReading(2).subscribe({
      next: (list) => {
        const found = list.find((p) => p.comicId === comicId);
        if (found) {
          this.userProgress.set(found);
        }
      },
    });
  }
}
