import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { ReadingProgress, ReadingHistory } from '../../core/models/comic.model';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css'],
})
export class LibraryComponent implements OnInit {
  private progressService = inject(ProgressService);

  continueList = signal<ReadingProgress[]>([]);
  historyList = signal<ReadingHistory[]>([]);
  activeTab = signal<'progress' | 'history'>('progress');
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.progressService.getContinueReading(2).subscribe({
      next: (data) => {
        this.continueList.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.progressService.getRecentHistory(2).subscribe({
      next: (history) => {
        this.historyList.set(history);
      },
    });
  }

  setTab(tab: 'progress' | 'history') {
    this.activeTab.set(tab);
  }
}
