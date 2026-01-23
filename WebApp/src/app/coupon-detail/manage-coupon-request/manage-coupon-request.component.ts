import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { CartStatusEnum, CouponTypeEnum, CouponTypeTextEnum } from 'src/app/config/mastercode.const';
import { PaginationMetaData } from 'src/app/models/pagination.metadata';
import { CouponService } from 'src/app/services/coupon.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';


@Component({
  selector: 'app-manage-coupon-request',
  templateUrl: './manage-coupon-request.component.html',
  styleUrls: ['./manage-coupon-request.component.css']
})
export class ManageCouponRequestComponent implements OnInit {

  couponDetail: any[] = [];
  customerCoupon:any;
  pagination: PaginationMetaData;
  status: any[] = [];
  couponTypes: any[] = [];
  requestCoupon: any[]= [];

  filterForm: FormGroup;
  selectedCoupon: any;
  isrequest: boolean =false;
  viewBuy: boolean = false;
  
 
  constructor(
    private couponService: CouponService,
    private notificationService:  NotificationService,
    private routingService: RoutingService,
    private fb: FormBuilder
  ) { 
    this.status.push({Text: 'Open', Id: CartStatusEnum.OPEN});
    this.status.push({Text: 'In Progress', Id: CartStatusEnum.INPROGRESS});
    this.status.push({Text: 'Completed', Id: CartStatusEnum.ACCEPTED});


    this.couponTypes.push({Text: CouponTypeTextEnum.Single, Id: CouponTypeEnum.Single});
    this.couponTypes.push({Text: CouponTypeTextEnum.Multiple, Id: CouponTypeEnum.Multiple});
    this.couponTypes.push({Text: CouponTypeTextEnum.Bulk, Id: CouponTypeEnum.Bulk});

    this.filterForm = this.createForm();
    this.filterForm.patchValue({
      status:  this.status[1].Id,
      type:this.couponTypes[2].Id
    })
  }

  ngOnInit(): void {
    this.getCouponDetail();
    this.getRequestedCoupon();    

    this.filterForm.valueChanges.subscribe(data => {      
      this.getRequestedCoupon();
    })
  }



  getCouponDetail(){
    this.couponService.getCustomerCoupon()
        .subscribe((data: any) => {
          this.customerCoupon = data;
        },
        error => {
          this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
        });
  }

  createForm(){
    return this.fb.group({
      status:[],
      type:[]
    })
  }

  buyCoupon(){
    this.routingService.routing('/auth/manage-coupon/buy-coupon')
  }

  getpricetofix(value){
    return value.toFixed(2)
  }

  getRequestedCoupon(){
   
    let ctrl = this.filterForm.controls;
    let detail = {
      StatusId: parseInt(ctrl.status.value),
      CouponType:  parseInt(ctrl.type.value)
    }

    this.couponService.customerAllRequestedCoupon(detail)
        .subscribe((data: any) => {
          this.requestCoupon = data;
        },
        error => {
          this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
        })
  }

  viewCoupon(coupon){
    this.selectedCoupon = coupon;
    this.isrequest = true;
    this.viewBuy = true;
  } 

  acceptRequest(event){
    this.getRequestedCoupon();
  }

}
