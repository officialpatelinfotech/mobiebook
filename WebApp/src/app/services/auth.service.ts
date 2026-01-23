import { Injectable } from '@angular/core';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  api: ApiLink = new ApiLink();

  constructor(private apiService: ApiService) { }

  registerUser(data){
    this.api.MethodName = 'RegisterUser/RegisterUser';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  loginUser(data) {
    this.api.MethodName = 'RegisterUser/LoginUser';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  saveForgotPassword(data) {
    this.api.MethodName = 'RegisterUser/SaveForgotPassword';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }


  updatePassword(data) {
    this.api.MethodName = 'RegisterUser/UpdateForgotPassword';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }


  adminLoginUser(data) {
    this.api.MethodName = 'RegisterUser/AdminLoginUser';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  resetForgotPassword(data) {
    this.api.MethodName = 'RegisterUser/AcResetPassword';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  getEalbumUniq(uniqId){
    this.api.MethodName = `RegisterUser/FnValidateAlbum?uniqId=${uniqId}`;
    return this.apiService.getData<any>(this.api.MethodName);
  }

}
