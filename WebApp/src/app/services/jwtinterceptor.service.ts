import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpErrorResponse, HttpRequest, HttpHandler } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { GLOBAL_VARIABLE } from '../config/globalvariable';

@Injectable({
    providedIn: 'root'
})
export class JwtInterceptorService implements HttpInterceptor {

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
                    
                    let errMsg = '';
                    // Client Side Error
                    if (error instanceof HttpErrorResponse) {
                        const errorDetail = error.error.errors === undefined ? error.error : error.error.errors;
                        if (error.status === 400) {
                            errMsg = `Error: ${errorDetail.message}`;
                        }
                        else if (errorDetail.MessageDetail) {
                            errMsg = errorDetail.MessageDetail;
                        }
                        else if (errorDetail.length > 0) {
                            errMsg = `Error: ${errorDetail[0].Message}`;
                        }
                        else {
                            errMsg = `Error: ${error.error}`;
                        }
                    }
                    else {  // Server Side Error
                        errMsg = `Error Code: ${error},  Message: ${error}`;
                    }
                    return throwError(errMsg);
                })
            );
    }
}
