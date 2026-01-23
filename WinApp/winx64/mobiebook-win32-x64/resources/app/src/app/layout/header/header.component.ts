import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  cartDetail: any[] = [];
  cartData: any[] = [];
  userDetails: any;
  profileMenu: boolean = false;
  productCountMenu: boolean = false;
  notificationMenu: boolean = false;
  logoChanges: boolean = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private localStoreService: LocalStorageService,
    private routingService: RoutingService,    
    private renderer: Renderer2
  ) {

  
    this.renderer.listen('window', 'click', (e: Event) => {
      this.profileMenu = false;
      this.productCountMenu =false;
      this.notificationMenu = false;
    });

  }

  ngOnInit(): void {
    let user= this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL);
    if(user != null){
      this.userDetails = JSON.parse(user);
    }
  }

 
  toogleMenu(e: any) {
    // const target: HTMLElement = e.target;
    // this.document.body.classList.toggle('mini-sidebar');
    // this.logoChanges = !this.logoChanges;
  }

  toogleMenuResponsive(e: any) {
    // const target: HTMLElement = e.target;
    // this.document.body.classList.toggle('show-sidebar');
    // this.document.body.classList.toggle('mini-sidebar');
   
  }

  profileMenuAction() {
    this.profileMenu = !this.profileMenu;

  }
  productCount() {
    this.productCountMenu = !this.productCountMenu;
  }
  noticationAction() {
    this.notificationMenu = !this.notificationMenu;
  }
  logout() {
    this.localStoreService.removeByKey(GLOBAL_VARIABLE.LOGIN_DETAIL);
    this.localStoreService.removeByKey(GLOBAL_VARIABLE.TOKEN);    
    this.routingService.routing('/');
  }

  loadCartDetail() {
    this.routingService.routing("/auth/manage-coupon/cart")
  }

  goToProfile() {
    this.routingService.routing("/auth/profile/profile")
  }


  getpricetofix(value: any) {
    return value.toFixed(2)
  }

}
