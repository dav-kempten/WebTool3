import { Injectable, computed, inject, signal } from '@angular/core';
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
 * `data.breadcrumb`. A leaf route carrying an `:id` param is labelled `#id`
 * until the detail page reports the entity's short title via
 * `setDetailTitle()`, which then replaces the `#id` crumb.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);

  readonly home: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  private readonly routeItems = signal<MenuItem[]>([]);
  private readonly detailTitle = signal<string | null>(null);

  readonly items = computed<MenuItem[]>(() => {
    const items = this.routeItems();
    const title = this.detailTitle();
    const last = items[items.length - 1];
    if (!title || !last?.label?.startsWith('#')) {
      return items;
    }
    return [...items.slice(0, -1), { ...last, label: title }];
  });

  /** Called by detail pages once the entity is loaded; cleared on navigation. */
  setDetailTitle(title: string | null): void {
    this.detailTitle.set(title);
  }

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.detailTitle.set(null);
        this.routeItems.set(this.build());
      });
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
      // Empty-path children (the list routes) inherit the parent's breadcrumb
      // data — skip them, otherwise "Touren > Touren" appears.
      if (label && segment && segment !== 'dashboard') {
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
