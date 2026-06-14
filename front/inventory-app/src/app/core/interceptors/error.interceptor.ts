import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  return next(req).pipe(
    catchError((err) => {
      const msg = err?.error?.message || err?.message || `Error ${err.status ?? ''}`;
      snack.open(`❌ ${msg}`, 'Cerrar', { duration: 5000, panelClass: ['snack-error'] });
      return throwError(() => err);
    })
  );
};
