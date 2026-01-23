import { Injectable } from '@angular/core';
import { ApiLink } from '../model/api.metadata';
import { LoginMetaData } from '../model/login.metadata';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  api: ApiLink = new ApiLink();

  constructor(private apiService: ApiService) { }

  registerUser(data: any){
    this.api.MethodName = 'RegisterUser/RegisterUser';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  loginUser(data: LoginMetaData) {
    this.api.MethodName = 'RegisterUser/LoginUser';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }

  saveForgotPassword(data: any) {
    this.api.MethodName = 'RegisterUser/SaveForgotPassword';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }


  updatePassword(data: any) {
    this.api.MethodName = 'RegisterUser/UpdateForgotPassword';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }


  adminLoginUser(data: any) {
    this.api.MethodName = 'RegisterUser/AdminLoginUser';
    this.api.Param = data;
    return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
  }
}
