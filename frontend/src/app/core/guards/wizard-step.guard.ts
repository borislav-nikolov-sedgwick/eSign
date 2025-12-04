import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { SessionService } from '../services/session.service';

// Define the step order for validation
const STEP_ORDER = ['postcode', 'two-factor', 'document', 'preview', 'complete'];

// Map session status to the route user should be on
function getCorrectRouteForStatus(status: string, session: any): string {
  switch (status) {
    case 'Completed':
      return '/complete';
    case 'Preview':
      return '/preview';
    case 'Signing':
    case 'DocumentViewing':
      return '/document';
    case 'TwoFactorVerification':
      return '/two-factor';
    case 'PostcodeVerification':
      return session.postcodeVerified ? '/two-factor' : '/postcode';
    case 'Pending':
    default:
      if (session.twoFactorVerified) {
        return '/document';
      } else if (session.postcodeVerified) {
        return '/two-factor';
      }
      return '/postcode';
  }
}

// Check if user can access a specific route based on their session state
function canAccessRoute(targetRoute: string, session: any): boolean {
  const correctRoute = getCorrectRouteForStatus(session.status, session);

  // User can access the page they should be on
  if (targetRoute === correctRoute) {
    return true;
  }

  // Special cases: allow going back to previous completed steps
  const currentStepIndex = STEP_ORDER.indexOf(correctRoute.replace('/', ''));
  const targetStepIndex = STEP_ORDER.indexOf(targetRoute.replace('/', ''));

  // Can't go to a step before current if it's not completed
  // Can't skip ahead
  if (targetStepIndex > currentStepIndex) {
    return false;
  }

  // Allow going back only if those steps are completed
  if (targetRoute === '/postcode' && !session.postcodeVerified) {
    return true; // Always allow postcode
  }
  if (targetRoute === '/two-factor' && session.postcodeVerified && !session.twoFactorVerified) {
    return true;
  }
  if (targetRoute === '/document' && session.twoFactorVerified) {
    return true;
  }
  if (targetRoute === '/preview' && session.status === 'Preview') {
    return true;
  }
  if (targetRoute === '/complete' && session.status === 'Completed') {
    return true;
  }

  return false;
}

export const wizardStepGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const apiService = inject(ApiService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  // Get token from query params or from session service
  const token = route.queryParamMap.get('token') || sessionService.getToken();

  if (!token) {
    router.navigate(['/expired']);
    return of(false);
  }

  // Always fetch fresh session state from backend
  return apiService.getSession(token).pipe(
    map(session => {
      // Update local session state
      sessionService.setSession(session);

      // Get the target route
      const targetRoute = '/' + route.routeConfig?.path;

      // Check if user can access this route
      if (canAccessRoute(targetRoute, session)) {
        return true;
      }

      // Redirect to correct route
      const correctRoute = getCorrectRouteForStatus(session.status, session);
      router.navigate([correctRoute]);
      return false;
    }),
    catchError(err => {
      if (err.status === 410) {
        router.navigate(['/expired']);
      } else {
        router.navigate(['/expired']);
      }
      return of(false);
    })
  );
};

// Guard for completion page - allows access if session was completed
export const completionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const apiService = inject(ApiService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const token = route.queryParamMap.get('token') || sessionService.getToken();

  if (!token) {
    router.navigate(['/expired']);
    return of(false);
  }

  return apiService.getSession(token).pipe(
    map(session => {
      sessionService.setSession(session);

      if (session.status === 'Completed') {
        return true;
      }

      // Redirect to correct route
      const correctRoute = getCorrectRouteForStatus(session.status, session);
      router.navigate([correctRoute]);
      return false;
    }),
    catchError(() => {
      router.navigate(['/expired']);
      return of(false);
    })
  );
};
