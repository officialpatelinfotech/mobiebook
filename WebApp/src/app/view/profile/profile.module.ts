import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from 'src/app/services/notification.service';
import { EditProfileComponent } from './edit-profile/edit-profile.component';

const routes: Routes = [  
  {
    path: 'profile',
    component: EditProfileComponent,
  },
  
];

@NgModule({
  declarations: [
    EditProfileComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  providers:[
    NotificationService
  ],
  exports:[
    EditProfileComponent
  ]
})
export class ProfileModule { }
