import { Injectable } from '@angular/core';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class Mp3Service {
    api: ApiLink = new ApiLink();
    constructor(private apiService: ApiService) { }

    addMp3(data) {
        this.api.MethodName = 'Mp3/AddMp3';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    addFavourate(data) {
        this.api.MethodName = 'Mp3/AddFavourate';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    deleteMp3(data) {
        this.api.MethodName = 'Mp3/DeleteMp3';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    setDefaultMp3(data) {
        this.api.MethodName = 'Mp3/SetDefaultMp3';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }


    getAllMp3Files(id) {
        this.api.MethodName = `Mp3/GetMp3List?userId=${id}`;
        return this.apiService.getData<any>(this.api.MethodName);
    }



}