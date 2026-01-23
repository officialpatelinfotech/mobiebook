import { Component, OnInit } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { PaginationMetaData } from 'src/app/models/pagination.metadata';
import { CartService } from 'src/app/services/cart.service';
import { CouponService } from 'src/app/services/coupon.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-buy-coupon',
  templateUrl: './buy-coupon.component.html',
  styleUrls: ['./buy-coupon.component.css']
})
export class BuyCouponComponent implements OnInit {
  couponDetail: any[] = [];
  customerCoupon: any;
  pagination: PaginationMetaData;
  selectedCoupon: any;
  viewBuy: boolean = false;
  isrequest: boolean = false;
  isbuydirect: boolean = false;
  bulkCoupon = GLOBAL_VARIABLE.BULK_COUPONTYPE;

  cartData: any[] = [];

  setPagination(page = 1): void {
    if (this.pagination === undefined) {
      this.pagination = new PaginationMetaData();
    }

    this.pagination.PageIndex = page;
    this.pagination.PageSize = 10;
    this.pagination.FilterString = '';
  }


  constructor(
    private couponService: CouponService,
    private notificationService: NotificationService,
    private routingService: RoutingService,
    private localStoreService: LocalstoreService,
    private cartService: CartService
  ) {
    this.setPagination();
  }

  ngOnInit(): void {
    this.getCouponsDetail();
  }

  getCouponsDetail(): void {
    this.couponService.getCoupons(this.pagination)
      .subscribe((data: any) => {
        this.couponDetail = data;
        this.couponDetail.forEach(x => {
          x.BuyQuantity = x.CouponTypeName === this.bulkCoupon ? x.Quantity : 1
        });

      },
        error => {
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        });
  }

  back() {
    this.routingService.routing('/auth/manage-coupon/coupons')
  }

  buyCoupon(coupon) {
    if (coupon.CouponTypeName == 'Bulk') {
      this.isbuydirect = false;
      this.isrequest = true;
    }
    else {
      this.isbuydirect = true;
      this.isrequest = false;
    }
    this.selectedCoupon = coupon;
    this.viewBuy = true;
  }

  addToCartDb(coupon) {
    let cartDetail = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.CART));
    let requestId = 0;

    let couponDetail = cartDetail.find(x => x.CouponId == coupon.CouponId);
    if (couponDetail != undefined) {
      if (couponDetail.RequestId != undefined && couponDetail.RequestId != null) {
        requestId = couponDetail.RequestId;
      }
    }

    let couponRequest = {
      RequestId: requestId,
      CouponId: coupon.CouponId,
      Quantity: coupon.BuyQuantity,
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

  getCartDetail() {
    this.couponService.acGetCart()
      .subscribe((data: any) => {
        this.cartData = data;
        // let cartDetail= JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.CART));
        // if(cartDetail == undefined){
        //   let detail  = [];
        //   this.cartData.forEach(z => {
        //       let row = cartDetail.find(x => x.CouponId == z.CouponId);
        //       if(row != undefined){
        //         row.RequestId = z.RequestId;
        //       }
        //       detail.push(row);
        //   });          
        this.localStoreService.setItem(GLOBAL_VARIABLE.CART, JSON.stringify(this.cartData));
        this.cartService.changeMessage("Item Added")
        // }
      },
        error => {
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        })
  }

  addToCart(cu) {
    let isAdd = true;
    if (cu.CouponTypeName === this.bulkCoupon) {
      if (cu.BuyQuantity < cu.Quantity) {
        this.notificationService.showError("Buy quantity should be equal and greater than buy quantity", GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        isAdd = false;
      }
    }   

    if (!isAdd)
      return;

    // let cartDetail= this.localStoreService.getItem(GLOBAL_VARIABLE.CART);
    // if(cartDetail == undefined){
    //   let detail  = [];
    //   detail.push(cu);
    //   this.localStoreService.setItem(GLOBAL_VARIABLE.CART,JSON.stringify(detail));
    // }
    // else{
    //   let coupon = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.CART));
    //   let isExist = coupon.find(x => x.CouponId == cu.CouponId);
    //   if(isExist == undefined){
    //     coupon.push(cu);
    //   }
    //   else{
    //     isExist.BuyQuantity = cu.BuyQuantity;
    //   } 
    //   this.localStoreService.setItem(GLOBAL_VARIABLE.CART,JSON.stringify(coupon));    
    // }
    this.addToCartDb(cu);

  }

  getpricetofix(value)
  {
    return value.toFixed(2)
  }


}
