import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyCouponPopupComponent } from './buy-coupon-popup.component';

describe('BuyCouponPopupComponent', () => {
  let component: BuyCouponPopupComponent;
  let fixture: ComponentFixture<BuyCouponPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuyCouponPopupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyCouponPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
