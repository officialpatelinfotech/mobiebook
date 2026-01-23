import { Injectable } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { map, pluck, take } from 'rxjs/operators';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class CommonService {
    api: ApiLink = new ApiLink();

    constructor(private apiService: ApiService) { }

    getMasterByCode(masterCode): any {
        this.api.MethodName = "Common/GetMasterByCode?masterCode=" + masterCode;
        return this.apiService.getData<any>(this.api.MethodName);
    }

    getCountryDropdown(): any {
        this.api.MethodName = 'Common/GetCountryDetail';
        return this.apiService.getData<any>(this.api.MethodName);
    }

    imageToBase64(fileReader: FileReader, fileToRead: File): Observable<string> {
        fileReader.readAsDataURL(fileToRead);
        return fromEvent(fileReader, 'load').pipe(pluck('currentTarget', 'result'));
    }

    getDashboardDetail(): any {
        this.api.MethodName = "EAlbum/GetDashboardDetail";
        return this.apiService.getData<any>(this.api.MethodName);
    }

    getDashboardDetailView(code: string): any {
        this.api.MethodName = "EAlbum/FnGetDashboardDetailView?code="+code;
        return this.apiService.getData<any>(this.api.MethodName);
    }
}


