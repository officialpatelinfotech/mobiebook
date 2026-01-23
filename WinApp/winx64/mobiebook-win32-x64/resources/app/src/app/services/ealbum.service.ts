import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GLOBAL_VARIABLE } from '../config/globalvariable';
import { ApiLink } from '../model/api.metadata';
import { ApiService } from './api.service';
import { from, Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EalbumService {
  api: ApiLink = new ApiLink();
  
  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) { }

  addAlbumDetail(data: any) {
    this.api.MethodName = 'EAlbum/AddAlbum';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  addLabAlbumDetail(data: any) {
    this.api.MethodName = 'EAlbum/AddLabAlbum';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  addAlbumImage(data: any) {
    this.api.MethodName = 'EAlbum/AcUploadImage';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  byteFormat(bytes: any) {
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    bytes = parseInt(bytes);
    if (bytes < 0 || isNaN(bytes)) return '0 B';
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  }


  upload(formData: any,method: any): Observable<HttpEvent<any>> {
  
    const req = new HttpRequest('POST', `${GLOBAL_VARIABLE.SERVER_LINK}${method}`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req);
  }

  getFiles(): Observable<any> {
    return this.http.get(`${GLOBAL_VARIABLE.SERVER_LINK}/files`);
  }

  getPhotographerId(data: any) {
    this.api.MethodName = 'EAlbum/GetPhotgraperId';
    this.api.Param = {UserName : data };
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  getAudioDropdown() {
    this.api.MethodName = `Mp3/GetAudioDropdown`;
    return this.apiService.getData<any>(this.api.MethodName);
  }
}
