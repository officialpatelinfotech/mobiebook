import { Injectable } from '@angular/core';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AlbumService {
  api: ApiLink = new ApiLink();

  constructor(private apiService: ApiService) { }

  loginCustomer(data) {
    this.api.MethodName = 'RegisterUser/AcValidateCustomer';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  getAlbumPageDetail(albumId){
    this.api.MethodName = `EAlbum/GetCustomerAlbumPageDetail?albumId=${albumId}`;
    return this.apiService.getData<any>(this.api.MethodName);
  }

  userDetail(albumId) {
    this.api.MethodName = `RegisterUser/AcGetUserDetail?ealbumId=${albumId}`;
    return this.apiService.getData<any>(this.api.MethodName);
  }
}
