import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 410) {
        router.navigate(['/expired']);
      } else if (error.status === 423) {
        notification.error('Session locked due to too many failed attempts');
      } else if (error.status === 0) {
        notification.error('Network error. Please check your connection.');
      }
      return throwError(() => error);
    })
  );
};

