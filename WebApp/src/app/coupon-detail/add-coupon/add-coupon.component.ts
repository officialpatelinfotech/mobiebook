import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateCustomParserFormatter } from 'src/app/config/dateformat';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { MasterCodeEnum } from 'src/app/config/mastercode.const';
import { AddCouponMetaData } from 'src/app/models/addcoupon.metadata';
import { CountryMetaData } from 'src/app/models/country.metadata';
import { DropDownMetaData } from 'src/app/models/dropdown.metadata';
import { CommonService } from 'src/app/services/common.service';
import { CouponService } from 'src/app/services/coupon.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-add-coupon',
  templateUrl: './add-coupon.component.html',
  styleUrls: ['./add-coupon.component.css'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter }
  ]
})
export class AddCouponComponent implements OnInit {
  addCouponForm: FormGroup;
  masterDetail: DropDownMetaData[] = [];
  countryDetail: CountryMetaData[] = [];
  addCoupon: AddCouponMetaData;

  couponDetails: any;
  startDate:any;
  expireDate: any;

  constructor(
    private routingService: RoutingService,
    private fb: FormBuilder,
    private commonService: CommonService,
    private couponService: CouponService,
    private notificationService: NotificationService,
    private activeRouter: ActivatedRoute,
  ) {
    this.addCoupon = new AddCouponMetaData();
    this.addCouponForm = this.createForm();
    this.activeRouter.params.subscribe((param: any) => {
      // tslint:disable-next-line: triple-equals
      if (param.id != undefined) {
        
        this.addCoupon.CouponId =+ param.id;
        this.getCouponDetails();
      }
      else
      {
        this.addCoupon.CouponId = 0
      }
    });
   
  }

  ngOnInit(): void {
    this.getMaster();    
  }

  createForm(): any {
    return this.fb.group({
      title: [, [Validators.required]],
      type: [, [Validators.required]],
      country: [, [Validators.required]],
      price: [, [Validators.required]],
      quantity: [, [Validators.required]],
      starton: [],
      expireon: [],
      isactive: []
    });
  }

  addCouponDetail(): void {
    debugger;
    let formCtrl = this.addCouponForm.controls;
    if (this.addCouponForm.valid) {
      this.addCoupon.CountryId = parseInt(formCtrl.country.value);
      if(this.addCoupon.CouponId == null){
        this.addCoupon.CouponId = 0;
      }   
      
      // tslint:disable-next-line: radix
      this.addCoupon.CouponTypeId = parseInt(formCtrl.type.value);
      this.addCoupon.Title = formCtrl.title.value;
      this.addCoupon.Price = formCtrl.price.value;     
     
      this.addCoupon.IsActive = formCtrl.isactive.value;
      this.addCoupon.Quantity = parseInt(formCtrl.quantity.value);

      if(formCtrl.starton.value != undefined && formCtrl.starton.value != null){
        let stDate = formCtrl.starton.value;
        let startDate = new Date(stDate.year, stDate.month - 1, stDate.day);
        this.addCoupon.StartedOn = startDate;
      }

      if(formCtrl.expireon.value != undefined && formCtrl.expireon.value != null){
        let exDate = formCtrl.expireon.value;
        let expDate = new Date(exDate.year, exDate.month - 1, exDate.day);
        this.addCoupon.ExpireOn = expDate;
      }

      this.couponService.addCoupon(this.addCoupon)
        .subscribe((data: any) => {
            this.notificationService.showSuccess(GLOBAL_VARIABLE.COUPON_ADDEDD,GLOBAL_VARIABLE.SUCCESS_MSG_TYPE)
            this.back();
          },
          error => {           
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
          });
    }
  }

  uploadFile(event): void {
    if (event === null && event === undefined) {
      console.error('No file selected');
    } else {

      const reader = new FileReader();
      this.commonService.imageToBase64(reader, event[0])
        .subscribe((data) => {
          this.addCoupon.ImageLink = data;
        });

    }
  }

  getMaster(): void {
    this.commonService.getMasterByCode(MasterCodeEnum.CouponType)
      .subscribe((data: any) => {
        this.masterDetail = data;
        this.getCountry();
      },
        error => {
          console.log(error);
        })
  }

  getCountry(): void {
    this.commonService.getCountryDropdown()
      .subscribe((data: any) => {
        this.countryDetail = data;
        if(this.addCoupon.CouponId == 0)
        {
          this.patchInitialValue()
        }
      },
        error => {
          console.log(error);
        })
  }

  getCouponDetails(){
    this.couponService.getCouponDetailById( this.addCoupon.CouponId)
        .subscribe((data: any) => {         
            this.addCouponForm.patchValue({
              title: data.CouponTitle,
              type:data.CouponTypeId,
              country: data.CountryId,
              price: data.CouponPrice,
              quantity: data.Quantity,
             // starton: data.StartedOn,
              //expireon: new Date(data.ExpireOn),
              isactive: data.IsActive
            });

            if (data.StartedOn != null) {
              let startDate = new Date(data.StartedOn);
              this.addCouponForm.patchValue({
                starton: { year: startDate.getFullYear(), month: startDate.getMonth() + 1, day: startDate.getDate() }
              });
            }

            if (data.ExpireOn != null) {
              let expireDate = new Date(data.ExpireOn);
              this.addCouponForm.patchValue({
                expireon: { year: expireDate.getFullYear(), month: expireDate.getMonth() + 1, day: expireDate.getDate() }
              });
            }           
        },
        error => {
          console.log(error);
        })

    
  }

  back(): void {
    this.routingService.routing('auth/manage-coupon');
  }

  patchInitialValue()
  {
    this.addCouponForm.patchValue({
      type:this.masterDetail[0].Id,
      country: this.countryDetail[0].CountryId,
    });

  }

  get f(){
    return this.addCouponForm.controls;
  }

}
