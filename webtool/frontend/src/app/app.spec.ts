import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService, ConfirmationService } from 'primeng/api';
import { App } from './app';
import { routes } from './app.routes';

async function start(sessionUser: object) {
  try {
    sessionStorage.clear();
  } catch {
    /* not available */
  }
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter(routes),
      provideHttpClient(),
      provideHttpClientTesting(),
      MessageService,
      ConfirmationService,
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  const http = TestBed.inject(HttpTestingController);
  const navigation = router.navigateByUrl('/tours');
  // The session check the guard waits for.
  http.expectOne((r) => r.url === '/api/login/' && r.method === 'GET').flush(sessionUser);
  await navigation;
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, router };
}

describe('App', () => {
  it('sends an anonymous visitor to the login page, without the menu', async () => {
    const { fixture, router } = await start({});
    expect(router.url).toBe('/login?returnUrl=%2Ftours');
    expect(fixture.nativeElement.querySelector('avk-main-menu')).toBeNull();
  });

  it('lets a logged-in user in and shows who is logged in', async () => {
    const { fixture, router } = await start({ id: 7, firstName: 'Lina', lastName: 'Wansel', role: 'guide' });
    expect(router.url).toBe('/tours');
    const menu: HTMLElement = fixture.nativeElement.querySelector('avk-main-menu');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Lina Wansel');
    expect(menu.textContent).toContain('Trainer');
  });
});
