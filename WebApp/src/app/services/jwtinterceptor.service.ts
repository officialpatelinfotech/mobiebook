import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpErrorResponse, HttpRequest, HttpHandler } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { GLOBAL_VARIABLE } from '../config/globalvariable';

@Injectable({
    providedIn: 'root'
})
export class JwtInterceptorService implements HttpInterceptor {

    constructor(private router: Router) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
       
        if (localStorage.length > 0) { 
            let token = localStorage.getItem(GLOBAL_VARIABLE.TOKEN)
            if (token !== undefined && token !== null) {
                request = request.clone({
                    setHeaders: {
                        AuthKey: localStorage.getItem(GLOBAL_VARIABLE.TOKEN),
                    }
                }); 
            }
        }

        let ignore =
        typeof request.body === "undefined"
        || request.body === null
        || request.body.toString() === "[object FormData]" // <-- This solves problem for publish the file.
        || request.headers.has("Content-Type");
  
      if (ignore) {
        return next.handle(request);
      }


        request = request.clone({ headers: request.headers.set('Content-Type', 'application/json') });
        return next.handle(request)
            .pipe(
                catchError((error: HttpErrorResponse) => {

                    const serverBase = (GLOBAL_VARIABLE.SERVER_LINK ?? '').toString();

                    if (error.status === 0) {
                        return throwError(`Network error: cannot reach API at ${serverBase}`);
                    }

                    if (error.status === 401 || error.status === 403) {
                        try {
                            localStorage.removeItem(GLOBAL_VARIABLE.TOKEN);
                            localStorage.removeItem(GLOBAL_VARIABLE.LOGIN_DETAIL);
                            localStorage.removeItem(GLOBAL_VARIABLE.Setting);
                        } catch {
                            // ignore storage errors
                        }

                        try {
                            this.router.navigate(['/authenticate/login']);
                        } catch {
                            // ignore navigation errors
                        }
                        return throwError('Unauthorized: please login again.');
                    }

                    const payload: any = (error as any)?.error;

                    if (typeof payload === 'string') {
                        return throwError(payload || `HTTP ${error.status}`);
                    }

                    if (payload && typeof payload === 'object') {
                        if (payload.MessageDetail) {
                            return throwError(payload.MessageDetail);
                        }
                        if (payload.message) {
                            return throwError(payload.message);
                        }
                        if (payload.title) {
                            return throwError(payload.title);
                        }
                        // ASP.NET Core model state: { errors: { Field: ["msg"] } }
                        if (payload.errors && typeof payload.errors === 'object') {
                            const firstKey = Object.keys(payload.errors)[0];
                            const firstVal = firstKey ? payload.errors[firstKey] : undefined;
                            if (Array.isArray(firstVal) && firstVal.length > 0) {
                                return throwError(firstVal[0]);
                            }
                        }
                        // Some endpoints return array of { Message }
                        if (Array.isArray(payload) && payload.length > 0) {
                            const first = payload[0];
                            if (first?.Message) {
                                return throwError(first.Message);
                            }
                        }

                        try {
                            return throwError(JSON.stringify(payload));
                        } catch {
                            return throwError(`HTTP ${error.status}`);
                        }
                    }

                    return throwError(`HTTP ${error.status}`);
                })
            );
    }
}
