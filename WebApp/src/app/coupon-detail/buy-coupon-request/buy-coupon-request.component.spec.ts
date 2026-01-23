import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyCouponRequestComponent } from './buy-coupon-request.component';

describe('BuyCouponRequestComponent', () => {
  let component: BuyCouponRequestComponent;
  let fixture: ComponentFixture<BuyCouponRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuyCouponRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyCouponRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
