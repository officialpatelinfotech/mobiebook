import { Injectable } from '@angular/core';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    api: ApiLink = new ApiLink();

    constructor(private apiService: ApiService) { }


    getUserList(data) {
        this.api.MethodName = 'User/AcGetUserList';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    updateLabWindowApp(data) {
        this.api.MethodName = 'User/AcUpdateUserWindowAppStatus';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    updateLabStatus(data) {
        this.api.MethodName = 'User/AcUpdateUserStatus';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    updateSetting(data) {
        this.api.MethodName = 'User/AcUpdateSetting';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }


    getSettingDetails() {
        this.api.MethodName = `User/FnGetSettingDetail`;
        return this.apiService.getData<any>(this.api.MethodName);
    }



}