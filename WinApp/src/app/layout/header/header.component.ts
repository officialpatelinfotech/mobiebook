import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { PreferencesModalService } from 'src/app/services/preferences-modal.service';
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
    private preferencesModalService: PreferencesModalService,
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

  private getCurrentUserIdText(): string {
    try {
      const raw = this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL);
      if (!raw) return 'anonymous';
      const parsed = JSON.parse(raw);
      const userId = parsed?.UserId ?? parsed?.userId ?? parsed?.userid;
      const asText = String(userId ?? '').trim();
      return asText || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  private getQrBarcodePrefKeyForUser(userId: string): string {
    return `QR_GENERATE_BARCODE_${userId}`;
  }

  private getQrFolderNameBelowBarcodePrefKeyForUser(userId: string): string {
    return `QR_PRINT_FOLDER_NAME_BELOW_BARCODE_${userId}`;
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
    // Reset barcode preferences on logout (image background should remain unchanged).
    const userId = this.getCurrentUserIdText();
    if (userId && userId !== 'anonymous') {
      this.localStoreService.removeByKey(this.getQrBarcodePrefKeyForUser(userId));
      this.localStoreService.removeByKey(this.getQrFolderNameBelowBarcodePrefKeyForUser(userId));
    }

    this.localStoreService.removeByKey(GLOBAL_VARIABLE.LOGIN_DETAIL);
    this.localStoreService.removeByKey(GLOBAL_VARIABLE.TOKEN);    
    this.routingService.routing('/');
  }

  openPreferences() {
    this.preferencesModalService.open();
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
