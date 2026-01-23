import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ManagePhotographerComponent } from './manage-photographer/manage-photographer.component';
import { NgxPaginationModule } from 'ngx-pagination';

const routes: Routes = [
  {
    path: '',
    component: ManagePhotographerComponent,
  },
  {
    path: 'manage-lab',
    component: ManagePhotographerComponent,
  },
];

@NgModule({
  declarations: [
    ManagePhotographerComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes),
    NgxPaginationModule
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
export class ManagePhotographerModule { }
