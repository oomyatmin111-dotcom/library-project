import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'comic/:slug',
    loadComponent: () =>
      import('./features/comic-detail/comic-detail.component').then((m) => m.ComicDetailComponent),
  },
  {
    path: 'reader/:issueId',
    loadComponent: () =>
      import('./features/reader/reader.component').then((m) => m.ReaderComponent),
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/library/library.component').then((m) => m.LibraryComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
