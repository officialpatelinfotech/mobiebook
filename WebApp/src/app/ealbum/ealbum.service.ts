import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { GLOBAL_VARIABLE } from '../config/globalvariable';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from '../services/api.service';
import { LocalstoreService } from '../services/localstore.service';

@Injectable({
  providedIn: 'root'
})
export class EalbumService {
  api: ApiLink = new ApiLink();
  private subject = new Subject<any>();

  constructor(
    private apiService: ApiService,
    private localStoreService: LocalstoreService
  ) { }

  addAlbumDetail(data) {
    this.api.MethodName = 'EAlbum/AddAlbum';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  splitBaseImage(fileName: string, base64Img: any) {
    if (base64Img == undefined || base64Img == null) {
      let imgRaw = base64Img.split(';');
      if (imgRaw.length > 0) {
        let makeImg = "data:image/jpg;" + imgRaw[1];
        return makeImg;
      }
    }
  }

  addAlbumImage(data) {
    this.api.MethodName = 'EAlbum/AcUploadImage';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  getAlbumDetailById(id) {
    this.api.MethodName = `EAlbum/GetAlbumDetail?albumId=${id}`;
    return this.apiService.getData<any>(this.api.MethodName);
  }

  byteFormat(bytes) {
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    bytes = parseInt(bytes);
    if (bytes < 0 || isNaN(bytes)) return '0 B';
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  }

  acAlbums(data) {
    this.api.MethodName = 'EAlbum/AcGetEAlbum';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  getAudioDropdown() {
    this.api.MethodName = `Mp3/GetAudioDropdown`;
    return this.apiService.getData<any>(this.api.MethodName);
  }

  getAlbumPageDetail(albumId){
    this.api.MethodName = `EAlbum/GetAlbumPageDetail?albumId=${albumId}`;
    return this.apiService.getData<any>(this.api.MethodName);
  }

  publishAlbumDetail(data) {
    this.api.MethodName = 'EAlbum/AcPublishedEAlbum';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  deleteAlbumPage(data){
    this.api.MethodName = 'EAlbum/AcDeletePage';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  deleteAlbumDetail(data){
    this.api.MethodName = 'EAlbum/AcDeleteAlbum';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  deleteAlbumAllPages(data){
    this.api.MethodName = 'EAlbum/AcDeleteAllPage';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  acUpdateAlbumSequence(data) {
    this.api.MethodName = 'EAlbum/AcUpdateSequence';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  contentDetail(data: any[], yesFn: () => void, noFn: () => void): any {
    this.setData(data, yesFn, noFn);
  }

  setData(detail: any[], yesFn: () => void, noFn: () => void): any {
    const that = this;
    this.subject.next({
      type: 'confirm',
      data: detail,
      yesFn(): any {
        that.subject.next(); // This will close the modal
        yesFn();
      },
      noFn(): any {
        that.subject.next();
        noFn();
      }
    });

  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }

  isAllowToAddAlbum(){
    let currenctUser = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL));
    let setting = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.Setting));  
    let ealbum = setting.find(x => x.UserType == currenctUser.UserTypeId);
    if(ealbum != undefined){
      return ealbum.IsAlbumUpload;
    }
    return false;
  }

}
