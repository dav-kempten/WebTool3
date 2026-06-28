import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    data: { breadcrumb: 'Dashboard' },
  },
  {
    path: 'tours',
    data: { breadcrumb: 'Touren' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/tours/tour-list/tour-list').then((m) => m.TourList),
        pathMatch: 'full',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/tours/tour-detail/tour-detail').then((m) => m.TourDetail),
      },
    ],
  },
  {
    path: 'instructions',
    data: { breadcrumb: 'Kurse' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/instructions/instruction-list/instruction-list').then(
            (m) => m.InstructionList,
          ),
        pathMatch: 'full',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/instructions/instruction-detail/instruction-detail').then(
            (m) => m.InstructionDetail,
          ),
      },
    ],
  },
  // Ported in Phase 3 — placeholder so the menu links resolve.
  {
    path: 'sessions',
    data: { breadcrumb: 'Gruppen' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/sessions/session-list/session-list').then(
            (m) => m.SessionList,
          ),
        pathMatch: 'full',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/sessions/session-detail/session-detail').then(
            (m) => m.SessionDetail,
          ),
      },
    ],
  },
  {
    path: 'talks',
    loadComponent: () =>
      import('./features/coming-soon/coming-soon').then((m) => m.ComingSoon),
    data: { breadcrumb: 'Events' },
  },
  {
    path: 'trainers',
    data: { breadcrumb: 'Trainer' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/guides/guide-list/guide-list').then((m) => m.GuideList),
        pathMatch: 'full',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/guides/guide-detail/guide-detail').then(
            (m) => m.GuideDetail,
          ),
      },
    ],
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () =>
      import('./features/page-not-found/page-not-found').then((m) => m.PageNotFound),
  },
];
