import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageBuyCouponComponent } from './manage-buy-coupon.component';

describe('ManageBuyCouponComponent', () => {
  let component: ManageBuyCouponComponent;
  let fixture: ComponentFixture<ManageBuyCouponComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageBuyCouponComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageBuyCouponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
