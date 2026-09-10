import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (!user) {
      authService.openAuthModal('login');
      return router.createUrlTree(['/']);
    }

    if (allowedRoles.includes(user.roleName) || user.roleName === 'ADMIN') {
      return true;
    }

    // Not authorized
    return router.createUrlTree(['/']);
  };
};
