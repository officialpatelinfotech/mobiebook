import { Injectable } from '@angular/core';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    api: ApiLink = new ApiLink();

    constructor(private apiService: ApiService) { }

    updateProfile(data) {
        this.api.MethodName = 'Profile/UpdateProfile';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    getProfileDetailById(id) {
        this.api.MethodName = `Profile/GetProfileById?userId=${id}`;
        return this.apiService.getData<any>(this.api.MethodName);
    }

}