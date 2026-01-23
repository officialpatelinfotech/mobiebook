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
import { SharedModule } from '../shared/shared.module';
import { AddMp3Component } from './add-mp3/add-mp3.component';
import { ManageMp3Component } from './manage-mp3/manage-mp3.component';
import { NgxPaginationModule } from 'ngx-pagination';


const routes: Routes = [
  {
    path: '',
    component: ManageMp3Component,
  },
  {
    path: 'manage-mp3',
    component: ManageMp3Component,
  },
  {
    path: 'add-mp3',
    component: AddMp3Component,
  },
  {
    path: 'edit-mp3/:id',
    component: AddMp3Component,
  },
];

@NgModule({
  declarations: [
    AddMp3Component,
    ManageMp3Component

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
export class ManageMp3Module { }
