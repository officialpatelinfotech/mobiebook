import { Component, OnInit } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { CartStatusEnum } from 'src/app/config/mastercode.const';
import { CartService } from 'src/app/services/cart.service';
import { CouponService } from 'src/app/services/coupon.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';
import { ConfimationService } from 'src/app/shared/confimation.service';

@Component({
  selector: 'app-shopping-detail',
  templateUrl: './shopping-detail.component.html',
  styleUrls: ['./shopping-detail.component.css']
})
export class ShoppingDetailComponent implements OnInit {
  cartDetailItem: any[] = [];
  cartDetailItemBulk: any[] = [];
  bulkCoupon = GLOBAL_VARIABLE.BULK_COUPONTYPE;
  totalAmount = 0;
  totalEstimateAmount = 0;
  currencySymbol: any;
  allItem: any[] = [];
  cartData: any[] = [];

  constructor(
    private cartService: CartService,
    private localStoreService: LocalstoreService,
    private routingService: RoutingService,
    private couponService: CouponService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfimationService,
  ) { }

  ngOnInit(): void {
    this.getCartDetail();
  }

  loadCart() {
    if (this.localStoreService.getItem(GLOBAL_VARIABLE.CART) != undefined) {
      this.cartData  = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.CART));
      this.cartDetailItem = this.cartData.filter(x => x.CouponType !== this.bulkCoupon);
      this.cartDetailItemBulk = this.cartData.filter(x => x.CouponType === this.bulkCoupon);
      this.calculateTotalAmount();
      this.calculateEstimateTotalAmount();
    }
  }

  remove(id) {
    this.cartData  = this.cartData .filter(x => x.RequestId != id);
    this.localStoreService.setItem(GLOBAL_VARIABLE.CART, JSON.stringify(this.cartData ));
    this.cartDetailItem = this.cartData.filter(x => x.CouponType !== this.bulkCoupon);
    this.cartDetailItemBulk = this.cartData.filter(x => x.CouponType === this.bulkCoupon);
    this.calculateTotalAmount();
    this.calculateEstimateTotalAmount();
    this.cartService.changeMessage('Item Remove');
  }

  buyCoupon() {
    this.routingService.routing('/auth/manage-coupon/buy-coupon')
  }

  continuePayment() {
    let pay = [];
    for(let i=0; i <  this.cartDetailItem.length;i++){
      pay.push({
        RequestId: this.cartDetailItem[i].RequestId,
        StatusId: CartStatusEnum.ACCEPTED
      });
    }
    this.couponService.updateCartStatus(pay)
        .subscribe((data: any) => {
          this.cartDetailItem = [];
          this.notificationService.showSuccess("Thanks for buying coupons.", GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          this.cartData  = this.cartData.filter(x => x.CouponType !== this.bulkCoupon);
        },
        error => {
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        })
  }

  calculateTotalAmount() {
    this.totalAmount = 0;
    this.cartDetailItem.forEach(x => {

      this.totalAmount += x.TotalPrice;
      this.currencySymbol = x.CurrencySymbol
    })
  }

  calculateEstimateTotalAmount() {
    this.totalEstimateAmount = 0;
    this.cartDetailItemBulk.forEach(x => {
      this.totalEstimateAmount += x.TotalPrice;
      this.currencySymbol = x.CurrencySymbol
    })
  }

  getCartDetail() {
    this.couponService.acGetCart()
      .subscribe((data: any) => {
        this.cartData = data;
        this.cartDetailItem = this.cartData.filter(x => x.CouponType !== this.bulkCoupon);
        this.cartDetailItemBulk = this.cartData.filter(x => x.CouponType === this.bulkCoupon);
        this.calculateTotalAmount();
        this.calculateEstimateTotalAmount();
      },
        error => {
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        })
  }

  updateQty(coupon) {
    if (coupon.RequestQuantity > 0) {
      coupon.TotalPrice = coupon.RequestQuantity * coupon.CouponPrice;

      let couponRequest = {
        RequestId: coupon.RequestId,
        CouponId: coupon.CouponId,
        Quantity: coupon.RequestQuantity,
        Notes: ""
      }
      this.couponService.buyCoupon(couponRequest)
        .subscribe((data: any) => {
          this.getCartDetail();
        },
          error => {
            this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          });
    }

  }

  removeItemRow(id){
    this.couponService.removeCartItem(id)
        .subscribe((data: any) =>{
          this.remove(id);
        },
        error => {
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        });
  }

  confirmation(id): any {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.DELETE_CONFIRM_MESSAGE, () =>  {
        this.removeItemRow(id); 
    }, () => {
      //cancel event
    });
  }

  continueBulkPayment() {
    let pay = [];
    for(let i=0; i <  this.cartDetailItemBulk.length;i++){
      pay.push({
        RequestId: this.cartDetailItemBulk[i].RequestId,
        StatusId: CartStatusEnum.INPROGRESS
      });
    }
    this.couponService.updateCartStatus(pay)
        .subscribe((data: any) => {
          this.cartDetailItemBulk = [];
          this.notificationService.showSuccess("Thanks for request coupons.We will respond soon", GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          this.cartData  = this.cartData.filter(x => x.CouponType === this.bulkCoupon);
        },
        error => {
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        })
  }


}
