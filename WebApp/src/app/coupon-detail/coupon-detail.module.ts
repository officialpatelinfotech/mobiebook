import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCouponComponent } from './add-coupon/add-coupon.component';
import { ManageCouponComponent } from './manage-coupon/manage-coupon.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonService } from '../services/common.service';
import { CouponService } from '../services/coupon.service';
import { ApiService } from '../services/api.service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptorService } from '../services/jwtinterceptor.service';
import { NotificationService } from '../services/notification.service';
import { ToastrService } from 'ngx-toastr';
import { SharedModule } from '../shared/shared.module';
import { ManageBuyCouponComponent } from './manage-buy-coupon/manage-buy-coupon.component';
import { BuyCouponComponent } from './buy-coupon/buy-coupon.component';
import { BuyCouponPopupComponent } from './buy-coupon-popup/buy-coupon-popup.component';
import { BuyCouponRequestComponent } from './buy-coupon-request/buy-coupon-request.component';
import { ShoppingDetailComponent } from './shopping-detail/shopping-detail.component';
import { ManageCouponRequestComponent } from './manage-coupon-request/manage-coupon-request.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  {
    path: '',
    component: ManageCouponComponent,
  },
  {
    path: 'coupons',
    component: ManageBuyCouponComponent,
  },
  {
    path: 'add-coupon',
    component: AddCouponComponent,
  },
  {
    path: 'edit-coupon/:id',
    component: AddCouponComponent,
  },
  {
    path:'buy-coupon',
    component: BuyCouponComponent
  },
  {
    path:'cart',
    component: ShoppingDetailComponent
  },
  {
    path: 'customer-request',
    component:ManageCouponRequestComponent
  }
];

@NgModule({
  declarations: [
    AddCouponComponent,
    ManageCouponComponent,
    ManageBuyCouponComponent,
    BuyCouponComponent,
    BuyCouponPopupComponent,
    BuyCouponRequestComponent,
    ShoppingDetailComponent,
    ManageCouponRequestComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgbModule,
    RouterModule.forChild(routes)
  ],
  providers:[
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptorService,
      multi: true
    },
    ApiService,
    CommonService,
    CouponService,   
    NotificationService,
  ]
})
export class CouponDetailModule { }
