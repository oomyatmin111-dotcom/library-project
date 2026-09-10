import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let clonedReq = req;
  if (token && !req.headers.has('Authorization')) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If unauthorized and we have a refresh token, attempt refresh
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          return authService.refreshToken().pipe(
            switchMap((newTokens) => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newTokens.accessToken}`,
                },
              });
              return next(retryReq);
            }),
            catchError((refreshErr) => {
              authService.logout();
              return throwError(() => refreshErr);
            }),
          );
        }
      }
      return throwError(() => error);
    }),
  );
};
