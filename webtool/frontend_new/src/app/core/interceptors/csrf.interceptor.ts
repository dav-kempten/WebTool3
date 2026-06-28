import { HttpInterceptorFn } from '@angular/common/http';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE = 'csrftoken';
const CSRF_HEADER = 'X-CSRFToken';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) {
    return null;
  }
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Attaches Django's CSRF token to unsafe, same-origin API requests so that
 * DRF's SessionAuthentication accepts them. The `csrftoken` cookie is set by
 * the login response (`rotate_token`); GET requests do not set it.
 *
 * This duplicates Angular's built-in XSRF handling but is explicit and reliable
 * (the built-in interceptor silently no-ops in several edge cases).
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.startsWith('/api') || req.url.includes('://');
  if (
    isApi &&
    UNSAFE_METHODS.has(req.method.toUpperCase()) &&
    !req.headers.has(CSRF_HEADER)
  ) {
    const token = readCookie(CSRF_COOKIE);
    if (token) {
      req = req.clone({ setHeaders: { [CSRF_HEADER]: token } });
    }
  }
  return next(req);
};
