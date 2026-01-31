import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpErrorResponse, HttpRequest, HttpHandler } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { GLOBAL_VARIABLE } from '../config/globalvariable';

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptorService  implements HttpInterceptor {
  
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {       
    if (localStorage.length > 0) { 
        let token = localStorage.getItem(GLOBAL_VARIABLE.TOKEN)
        if (token !== undefined && token !== null) {        
            request = request.clone({
                setHeaders: {
                    AuthKey: token,
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

                // `status === 0` is typically network error / CORS / server down.
                if (error.status === 0) {
                    return throwError('Network error: cannot reach server. Please ensure the API is running.');
                }

                let errMsg = '';
                const payload: any = error.error;

                if (typeof payload === 'string') {
                    errMsg = payload;
                }
                else if (payload?.message) {
                    errMsg = payload.message;
                }
                else if (payload?.MessageDetail) {
                    errMsg = payload.MessageDetail;
                }
                else if (payload?.errors && typeof payload.errors === 'object') {
                    const keys = Object.keys(payload.errors);
                    if (keys.length > 0) {
                        const first = payload.errors[keys[0]];
                        errMsg = Array.isArray(first) ? String(first[0]) : String(first);
                    }
                }
                else if (Array.isArray(payload) && payload.length > 0) {
                    const first = payload[0];
                    errMsg = first?.Message || first?.message || JSON.stringify(first);
                }
                else if (error.message) {
                    errMsg = error.message;
                }
                else {
                    errMsg = `HTTP ${error.status}`;
                }

                if (error.status === 401) {
                    errMsg = errMsg || 'Unauthorized';
                }

                if (!/^Error\s*:/i.test(errMsg)) {
                    errMsg = `Error: ${errMsg}`;
                }

                return throwError(errMsg);
            })
        );
}
}
