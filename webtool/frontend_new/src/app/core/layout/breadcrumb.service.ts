import { Injectable, inject, signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
} from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Builds the breadcrumb trail from the active route tree using each route's
 * `data.breadcrumb`. A leaf route carrying an `:id` param is labelled `#id`,
 * mirroring the behaviour of the old NgRx router serializer.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);

  readonly home: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  readonly items = signal<MenuItem[]>([]);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.items.set(this.build()));
  }

  private build(): MenuItem[] {
    const crumbs: MenuItem[] = [];
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let url = '';

    while (route) {
      const segment = route.url.map((s) => s.path).join('/');
      if (segment) {
        url += `/${segment}`;
      }
      const label = route.data?.['breadcrumb'] as string | undefined;
      if (label && segment !== 'dashboard') {
        crumbs.push({ label, routerLink: url });
      }
      if (route.params?.['id'] && crumbs.length) {
        crumbs[crumbs.length - 1].label = `#${route.params['id']}`;
      }
      route = route.firstChild;
    }

    return crumbs;
  }
}
