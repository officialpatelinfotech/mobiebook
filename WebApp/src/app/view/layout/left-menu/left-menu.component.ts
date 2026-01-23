import { Component, OnInit } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { PageDetailMetaData } from 'src/app/models/menudetail.metadata';
import { LocalstoreService } from 'src/app/services/localstore.service';

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
    private localStoreService: LocalstoreService
  ) { }

  ngOnInit(): void {
    
    if(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL) != undefined){
      let menu = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL));
      let menus = JSON.parse(menu.UserMenuDetails);
      this.menuDetail = menus.filter(x => x.PageCode != 'LCredit');  // hiding coupon code
      
      this.userDetails =   JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL))
    }
  }
  toogleMenu(e){ 
    const target: HTMLElement = e.target;
    target.classList.toggle('active');
    this.status = !this.status; 
  }
}
