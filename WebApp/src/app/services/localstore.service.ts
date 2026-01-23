import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalstoreService {

  constructor() { }

  setItem(name,data){
    localStorage.setItem(name,data);
  }

  getItem(name){
    return localStorage.getItem(name);
  }

  removeByKey(key){
    localStorage.removeItem(key);
  }

  clearAll(){
    localStorage.clear();
  }
}
