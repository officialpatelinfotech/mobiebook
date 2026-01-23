import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor() { }

  setItem(name: any,data: any){
    localStorage.setItem(name,data);
  }

  getItem(name: any){
    return localStorage.getItem(name);
  }

  removeByKey(key: any){
    localStorage.removeItem(key);
  }

  clearAll(){
    localStorage.clear();
  }
}
