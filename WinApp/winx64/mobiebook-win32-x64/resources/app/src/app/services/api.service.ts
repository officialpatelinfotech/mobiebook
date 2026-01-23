import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { GLOBAL_VARIABLE } from '../config/globalvariable';
import { Utilities } from '../config/untilities';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private actionUrl: string;
  public serverWithApiUrl = GLOBAL_VARIABLE.SERVER_LINK + GLOBAL_VARIABLE.API_LINK;

  constructor(private http: HttpClient) {
    this.actionUrl = this.serverWithApiUrl;
  }

  public getData<T>(apiMethod: any): Observable<T> {
    return this.http.get<T>(this.actionUrl + apiMethod);
  }

  public getDataByParam<T>(apiMethod: any, paramVal: any, paramName: any): Observable<T> {
    let params = new HttpParams();

    if (Utilities.isString(paramVal)) {
      params.append(paramName, paramVal);
    } else if (Utilities.isArray(paramVal)) {
      paramVal.forEach((actorName: string) => {
        params = params.append(paramName, actorName);
      });
    }

    return this.http.get<T>(this.actionUrl + apiMethod, { params });
  }

  public postData<T>(apiMethiod: string, param: any): Observable<T> {
    return this.http.post<T>(this.actionUrl + apiMethiod, JSON.stringify(param));
  }

  public externalAPI<T>(userURL: string): Observable<T> {
    return this.http.get<T>(userURL);
  }

  public update<T>(id: number, itemToUpdate: any): Observable<T> {
    return this.http.put<T>(this.actionUrl + id, itemToUpdate);
  }

  public delete<T>(id: number): Observable<T> {
    return this.http.delete<T>(this.actionUrl + id);
  }

  // tslint:disable-next-line: typedef
  public multiCall(api: any[]){
    const urls: any[] = [];
    api.forEach(x => {
      urls.push(this.http.get(this.actionUrl + x));
    });
    return forkJoin(urls);
  }

  public readTextFile<T>(path: any): Observable<T>{
    return this.http.get<T>(path);
  }
}
