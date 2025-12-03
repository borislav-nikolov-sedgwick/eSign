import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SessionService } from '../services/session.service';

export const wizardStepGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!sessionService.hasSession()) {
    // Try to get token from query params and redirect to intro
    const token = route.queryParamMap.get('token');
    if (token) {
      router.navigate(['/'], { queryParams: { token } });
    } else {
      router.navigate(['/']);
    }
    return false;
  }
  return true;
};
