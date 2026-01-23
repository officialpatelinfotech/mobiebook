import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationMetaData } from 'src/app/models/pagination.metadata';
import { CommonService } from 'src/app/services/common.service';
import { CouponService } from 'src/app/services/coupon.service';
import { RoutingService } from 'src/app/services/routing.service';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { ConfimationService } from 'src/app/shared/confimation.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-manage-coupon',
  templateUrl: './manage-coupon.component.html',
  styleUrls: ['./manage-coupon.component.css']
})
export class ManageCouponComponent implements OnInit, OnDestroy {
  counponDetail: any[] = [];
  pagination: PaginationMetaData;
  dateFormat = GLOBAL_VARIABLE.DEFAULT_DATE_FORMAT;


  setPagination(page = 1): void {
    if (this.pagination === undefined) {
      this.pagination = new PaginationMetaData();
    }

    this.pagination.PageIndex = page;
    this.pagination.PageSize = 10;
    this.pagination.FilterString = '';
  }

  constructor(
    private routingService: RoutingService,
    private commonService: CommonService,
    private couponService: CouponService,
    private confirmDialogService: ConfimationService,
    private notificationService: NotificationService
  ) { 
    this.setPagination();
  }

  ngOnInit(): void {
    this.getCouponsDetail();
  }

  addCoupon(): void {
    this.routingService.routing('auth/manage-coupon/add-coupon');
  }

  getCouponsDetail(): void {
    this.couponService.getCoupons(this.pagination)
        .subscribe((data: any) => {
          this.counponDetail = data;
        },
        error => {
          console.log(error);
        });
  }

  ngOnDestroy(): void{

  }

  editCoupon(couponId){
    this.routingService.routing(`auth/manage-coupon/edit-coupon/${couponId}`);
  }

  deleteCoupon(couponId){
      this.couponService.deleteCoupon(couponId)
          .subscribe((data: any) => {
            this.counponDetail = this.counponDetail.filter(x => x.CouponId == couponId);
            this.notificationService.showError(GLOBAL_VARIABLE.DELETE_MSG,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
            this.getCouponsDetail();
          },
          error => {
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          })
  }

  confirmation(id): any {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.DELETE_CONFIRM_MESSAGE, () =>  {
        this.deleteCoupon(id);
    }, () => {
      //cancel event
    });
  }

  getpricetofix(value)
  {
    return value.toFixed(2)
  }

}
