import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { ApiService } from './services/api.service';
const electron = (<any>window).require('electron');
var remote = electron.remote;
var electronFs = remote.require('fs');


@Injectable({
  providedIn: 'root'
})
export class ImagesService {

  images = new BehaviorSubject<string[]>([]);
  directory = new BehaviorSubject<string[]>([]);

  constructor(
    private apiService: ApiService
  ) {
    electron.ipcRenderer.on('getImagesResponse', (event:any, images:any) => {
      this.images.next(images);
    });
    electron.ipcRenderer.on('getDirectoryResponse', (event: any, directory: any) => {
      this.directory.next(directory);
    });
  }

  navigateDirectory(path: any) {
    console.log(path);
    electron.ipcRenderer.send('navigateDirectory', path);
  }

  getImageByDirectory(path: any){
    electron.ipcRenderer.send('navigateDirectory', path);
  }

  readText(path: any){
    return this.apiService.readTextFile<any>(path);
  }

  // getFolderTree(directory:any){
  //   electronFs.readdirSync(directory).forEach((file: string) => {
  //     if (electronFs.lstatSync(path.resolve(directory, file)).isDirectory()) {
  //       console.log('Directory: ' + file);
  //     } else {
  //       console.log('File: ' + file);
  //     }
  //   });
  // }


  
}
