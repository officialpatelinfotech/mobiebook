import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { CouponService } from 'src/app/services/coupon.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-buy-coupon-request',
  templateUrl: './buy-coupon-request.component.html',
  styleUrls: ['./buy-coupon-request.component.css']
})
export class BuyCouponRequestComponent implements OnInit {
  couponForm: FormGroup;
  @Input() couponDetail;
  @Input() isview =false;
  @Output() buyPopClick = new EventEmitter<boolean>();

  totalPrice: number = 0
  isclick: boolean = false;
  constructor(
    private fb:FormBuilder,
    private couponService: CouponService,
    private notificationService:  NotificationService,
  ) { }

  ngOnInit(): void {
    this.couponForm = this.createForm();

    this.couponForm.patchValue({
      quantity: this.couponDetail.RequestQuantity,
      requestprice: this.couponDetail.CouponPrice ,
    })

    this.totalPrice = this.couponDetail.RequestQuantity *  this.couponDetail.CouponPrice;

    this.couponForm.valueChanges.subscribe((data) => {
      this.calculateTotal();
    })
  }

  calculateTotal(){
    let ctrl = this.couponForm.controls;
    let qty = ctrl.quantity.value;
    let price = ctrl.requestprice.value;

    if(qty != null && qty != "" && price !=null && price != ""){
      this.totalPrice = parseFloat(qty) * parseFloat(price);
    }
  }
  
  createForm(){
    return this.fb.group({      
      quantity:[,[Validators.required]],
      requestprice:[,[Validators.required]],
      message: []
    });
  }

  cancel(){
    this.isview = false;
    this.buyPopClick.emit(false);
  }

  buy(){
    let form = this.couponForm.controls;
    let detail = {
      RequestId: this.couponDetail.RequestId,
      Quantity: parseInt(form.quantity.value),
      Price: parseFloat(form.requestprice.value),
      Notes: form.message.value,
      UserId: this.couponDetail.UserId
    }

    if(this.isclick == false){
      this.isclick = true;
      this.couponService.approveBulkRequest(detail)
      .subscribe((data: any) => {
        this.isview = false;
        this.isclick = false;
        this.buyPopClick.emit(true);
      },
      error => {
        this.isclick = false;
        this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
      })
    }

    
 
  }

  addCouponDetail(){
    this.isview = false;
    this.buyPopClick.emit(true);
  }

  
  getpricetofix(value)
  {
    return value.toFixed(2)
  }

}
