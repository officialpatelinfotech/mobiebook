import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EalbumInfoComponent } from './ealbum-info/ealbum-info.component';
import { EalbumCoverComponent } from './ealbum-cover/ealbum-cover.component';
import { EalbumPagesComponent } from './ealbum-pages/ealbum-pages.component';
import { EalbumSlidePagesComponent } from './ealbum-slide-pages/ealbum-slide-pages.component';
import { EalbumPublishComponent } from './ealbum-publish/ealbum-publish.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DragDropModule } from '@angular/cdk/drag-drop';
//import { SharedModule } from 'src/app/shared/shared.module';
import { EalbumService } from '../ealbum.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { ImgUploaderComponent } from './img-uploader/img-uploader.component';
import { EalbumPreviewComponent } from './ealbum-preview/ealbum-preview.component';
import { SwapImageComponent } from './swap-image/swap-image.component';





@NgModule({
  declarations: [
    EalbumInfoComponent,
    EalbumCoverComponent,
    EalbumPagesComponent,
    EalbumSlidePagesComponent,
    EalbumPublishComponent,
    ImgUploaderComponent,
    EalbumPreviewComponent,
    SwapImageComponent,
    
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,    
    NgSelectModule,    
    DragDropModule,
    NgbModule,
    SharedModule
  ],
  providers:[
    EalbumService,
    NotificationService,    
    //Ng2ImgMaxService
  ],
  exports:[
    EalbumInfoComponent,
    EalbumCoverComponent,
    EalbumPagesComponent,
    EalbumSlidePagesComponent,
    EalbumPublishComponent,
    ImgUploaderComponent
  ]
})
export class AlbumPagesModule { }
