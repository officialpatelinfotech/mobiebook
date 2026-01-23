import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewComponent } from './view.component';
import { RouterModule, Routes } from '@angular/router';
import { LayoutModule } from './layout/layout.module';
import { DashboardViewComponent } from './dashboard/dashboard-view.component';
import { SettingComponent } from './setting/setting.component';
import { ManageMasterComponent } from './manage-master/manage-master.component';
import { ManageCouponComponent } from '../coupon-detail/manage-coupon/manage-coupon.component';
import { ManageMp3Component } from '../manage-mp3/manage-mp3/manage-mp3.component';
import { SwiperModule } from 'swiper/angular';
import { DashboardDetailViewComponent } from './dashboard-detail-view/dashboard-detail-view.component';


const routes: Routes = [
  {
    path: 'auth',
    component: ViewComponent,
    children:[
      {
        path: 'manage-coupon',
        loadChildren: () => import('../coupon-detail/coupon-detail.module').then(m => m.CouponDetailModule)
      },
      {
        path: 'manage-lab',
        loadChildren: () => import('../manage-lab/manage-lab.module').then(m => m.ManageLabModule)
      },
      {
        path: 'manage-photographer',
        loadChildren: () => import('../manage-photographer/manage-photographer.module').then(m => m.ManagePhotographerModule)
      },

      {
        path: 'profile',
        loadChildren: () => import('../view/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path:'ealbum',
        loadChildren: () => import('../ealbum/ealbum.module').then(p => p.EalbumModule)
      },
       {
        path:'manage-mp3',
        loadChildren: () => import('../manage-mp3/manage-mp3.module').then(p => p.ManageMp3Module)
      },
      {
        path: 'setting',
        component: SettingComponent
      },
    ]
  },
  {
    path: 'dashboard',
    component: ViewComponent,
    children: [
      {
        path: 'dashboard-view',
        component: DashboardViewComponent,
      },
      {
        path: 'dashboard-view-detail/:id',
        component: DashboardDetailViewComponent,
      },
      {
        path: 'master',
        component: ManageMasterComponent
      },
      {
        path: 'setting',
        component: SettingComponent
      },
      {
        path: 'coupon',
        component: ManageCouponComponent
      },
      {
        path: 'mp3',
        component: ManageMp3Component
      }     
    ] 
  }
  
];

@NgModule({
  declarations: [
    ViewComponent,
    SettingComponent,
    ManageMasterComponent,
    DashboardViewComponent,
    DashboardDetailViewComponent,    
  ],
  imports: [
    CommonModule,
    SwiperModule,
    LayoutModule, 
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})
export class ViewModule { }
