import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidateCustomerComponent } from './validate-customer/validate-customer.component';
import { ShowAlbumComponent } from './show-album/show-album.component';
import { AlbumService } from './album.service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AlbumInterceptorService } from './album-interceptor.service';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { FinalViewComponent } from './final-view/final-view.component';
import { ViewToolbarComponent } from './view-toolbar/view-toolbar.component';

const routes: Routes = [    
  {
    path: 'validate/:id/:customerid',
    component: ValidateCustomerComponent
  },
  {
    path: 'view/:id',
    component: ShowAlbumComponent,
  },
  {
    path:'complete',
    component:FinalViewComponent
  }
]

@NgModule({
  declarations: [
    ValidateCustomerComponent,
    ShowAlbumComponent,
    FinalViewComponent,
    ViewToolbarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,   
    HttpClientModule,  
    RouterModule.forChild(routes),    
    SharedModule
  ],
  providers:[
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AlbumInterceptorService,
      multi: true
    },
    AlbumService
  ]
})
export class ViewAlbumModule { }
