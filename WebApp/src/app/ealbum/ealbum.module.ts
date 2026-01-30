import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageEalbumComponent } from './manage-ealbum/manage-ealbum.component';
import { AddEalbumComponent } from './add-ealbum/add-ealbum.component';
import { EalbumService } from './ealbum.service';

import { RouterModule, Routes } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { SanitizerUrlPipe } from '../custompipe/sanitizer.pipe';
import { UploaderComponent } from './uploader/uploader.component';
import { DisplayImgComponent } from './display-img/display-img.component';
import { ViewAlbumComponent } from './view-album/view-album.component';
import { SharedModule } from '../shared/shared.module';
import { NotificationService } from '../services/notification.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { StartPageComponent } from './start-page/start-page.component'; 
import { AlbumPagesModule } from './album-pages/album-pages.module';
import { NgxPaginationModule } from 'ngx-pagination';
//import { AlbumPagesModule } from './album-pages/album-pages.module';

const routes: Routes = [
  {
    path: '',
    component: ManageEalbumComponent,
  },
  {
    path: 'add-album',
    component: AddEalbumComponent,
  },
  {
    path: 'edit-album/:id',
    component: AddEalbumComponent
  },
  {
    path: 'add-album/:id',
    component: AddEalbumComponent,
    data: {
      IsAdd: true
    }
  }
]

@NgModule({
  declarations: [
    ManageEalbumComponent,
    AddEalbumComponent,    
    SanitizerUrlPipe,
    UploaderComponent,
    DisplayImgComponent,
    ViewAlbumComponent,
    StartPageComponent
  ],
  imports: [
    CommonModule,  
    FormsModule,
    ReactiveFormsModule,   
    RouterModule.forChild(routes),
    NgbModule,
    NgSelectModule,
    SharedModule,
    DragDropModule,
    AlbumPagesModule,
    NgxPaginationModule
  ],
  providers:[
    EalbumService,
    NotificationService,
  ],
  exports:[
    ViewAlbumComponent
  ]
})
export class EalbumModule { }
