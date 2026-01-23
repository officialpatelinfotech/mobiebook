import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCouponRequestComponent } from './manage-coupon-request.component';

describe('ManageCouponRequestComponent', () => {
  let component: ManageCouponRequestComponent;
  let fixture: ComponentFixture<ManageCouponRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageCouponRequestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageCouponRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
