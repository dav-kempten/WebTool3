import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Everything but the login page needs a login. Waits for the first session
 * check, so a new tab with a valid cookie is not sent to /login by mistake,
 * and remembers where the user wanted to go.
 */
export const authGuard: CanActivateChildFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    await auth.ready;
  }
  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' && state.url !== '/dashboard' ? { returnUrl: state.url } : {},
  });
};

/** Who is logged in already skips the login page. */
export const loginGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true;
};
