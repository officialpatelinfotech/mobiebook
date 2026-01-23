import { Component, OnInit } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { PageDetailMetaData } from 'src/app/model/page.metadata';
import { LocalStorageService } from 'src/app/services/local-storage.service';



@Component({
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css']
})
export class LeftMenuComponent implements OnInit {
  status: boolean = false;
  menuDetail: PageDetailMetaData[] =[];
  blankString = "";
  userDetails: any;
  constructor(
    private localStoreService: LocalStorageService
  ) { }

  ngOnInit(): void {
    
    if(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL) != undefined){
      let row = this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL);
      if(row!= null){
        let menu = JSON.parse(row);
        this.menuDetail = JSON.parse(menu.UserMenuDetails); 
      }
     
      let logDetail = this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL)
      if(logDetail != null){
        this.userDetails =   JSON.parse(logDetail)
      }
      
      
    }
  }
  toogleMenu(e: any){ 
    const target: HTMLElement = e.target;
    target.classList.toggle('active');
    this.status = !this.status; 
  }
}
