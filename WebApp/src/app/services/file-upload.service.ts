import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GLOBAL_VARIABLE } from '../config/globalvariable';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService { 

  constructor(private http: HttpClient) { }

  upload(formData: any,method): Observable<HttpEvent<any>> {
  
    const req = new HttpRequest('POST', `${GLOBAL_VARIABLE.SERVER_LINK}${method}`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req);
  }

  getFiles(): Observable<any> {
    return this.http.get(`${GLOBAL_VARIABLE.SERVER_LINK}/files`);
  }
}
