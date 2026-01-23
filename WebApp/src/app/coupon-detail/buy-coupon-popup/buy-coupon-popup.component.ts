import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-buy-coupon-popup',
  templateUrl: './buy-coupon-popup.component.html',
  styleUrls: ['./buy-coupon-popup.component.css']
})
export class BuyCouponPopupComponent implements OnInit {
  @Input() couponDetail;
  @Input() isview =false;
  @Output() buyPopClick = new EventEmitter<boolean>();
  constructor() { }

  ngOnInit(): void {
  }

  cancel(){
    this.isview = false;
    this.buyPopClick.emit(false);
  }

  buy(){
    this.isview = false;
    this.buyPopClick.emit(true);
  }

  getpricetofix(value)
  {
    return value.toFixed(2)
  }


}
