import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { CartService } from 'src/app/services/cart.service';
import { CouponService } from 'src/app/services/coupon.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
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
    private localStoreService: LocalstoreService,
    private routingService: RoutingService,
    private cartService: CartService,
    private couponService: CouponService,
    private renderer: Renderer2,
    private notificationService: NotificationService

  ) {

    this.cartService.currentMessage.subscribe(x => {
      this.loadCart();
    });
    this.renderer.listen('window', 'click', (e: Event) => {
      this.profileMenu = false;
      this.productCountMenu =false;
      this.notificationMenu = false;
    });

  }

  ngOnInit(): void {

    this.userDetails = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL))
    this.getCartDetail();

  }

  loadCart() {
    if (this.localStoreService.getItem(GLOBAL_VARIABLE.CART) != undefined) {
      this.cartDetail = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.CART));
    }
  }

  toogleMenu(e) {
    const target: HTMLElement = e.target;
    this.document.body.classList.toggle('mini-sidebar');
    this.logoChanges = !this.logoChanges;
  }

  toogleMenuResponsive(e) {
    const target: HTMLElement = e.target;
    this.document.body.classList.toggle('show-sidebar');
    this.document.body.classList.toggle('mini-sidebar');
    this.logoChanges = !this.logoChanges;
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
    this.localStoreService.clearAll();
    this.routingService.routing('/');
  }

  loadCartDetail() {
    this.routingService.routing("/auth/manage-coupon/cart")
  }

  goToProfile() {
    this.routingService.routing("/auth/profile/profile")
  }


  getpricetofix(value) {
    return value.toFixed(2)
  }

  getCartDetail() {
    this.couponService.acGetCart()
      .subscribe((data: any) => {
        this.cartData = data;
        this.localStoreService.setItem(GLOBAL_VARIABLE.CART, JSON.stringify(this.cartData));
        this.loadCart();
      },
        error => {
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        })
  }
}
