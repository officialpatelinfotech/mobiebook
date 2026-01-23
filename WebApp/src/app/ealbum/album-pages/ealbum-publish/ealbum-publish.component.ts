import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { forkJoin, from, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { GLOBAL_VARIABLE, PageViewType } from 'src/app/config/globalvariable';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';
import { ConfimationService } from 'src/app/shared/confimation.service';
import { EalbumService } from '../../ealbum.service';
import { EalbumPreviewComponent } from '../ealbum-preview/ealbum-preview.component';

@Component({
  selector: 'app-ealbum-publish',
  templateUrl: './ealbum-publish.component.html',
  styleUrls: ['./ealbum-publish.component.css']
})
export class EalbumPublishComponent implements OnInit {
  isPublished: boolean = false;
  popUpEalbum: boolean = false;
  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/";
  @Output() savePublishEvent = new EventEmitter<any>();

  @Input() ealbumId;
  @Input() imgType;

  albumPages: any[] = [];
  viewAlbum: any;

  @ViewChild('previeAlbum') previewAlbum:EalbumPreviewComponent;

  constructor(
    private albumService: EalbumService,
    private routingService: RoutingService,
    private confirmDialogService: ConfimationService,
    private notificationService: NotificationService,
    private localStoreService: LocalstoreService,
  ) { }

  ngOnInit(): void {
  }

  preview() {
    let api = of(this.ealbumId)
      .pipe(
        mergeMap(x => {
          let ealbumResp = this.albumService.getAlbumDetailById(this.ealbumId)
          let ealbumPageResp = this.albumService.getAlbumPageDetail(this.ealbumId)
          return forkJoin([ealbumResp, ealbumPageResp])
        })
      ).subscribe((data: any) => {       
        this.viewAlbum = data[0];
        this.albumPages = data[1];

        setTimeout(() => {
          this.displayImageDetail();
         
        }, 100)

      },
        error => {

        });
  }

  previous() {
    this.savePublishEvent.emit({status: "done", moveto: GLOBAL_VARIABLE.PREVIOUS});
  }

  goToMainPage() {
    this.routingService.routing("auth/ealbum");
  }

  

  displayImageDetail() {
    this.albumPages = [].slice.call(this.albumPages).sort((a, b) => (a.SequenceNo < b.SequenceNo ? -1 : 1));

    this.albumPages.forEach(x => {
      x.ImageLink = this.serverLink + this.viewAlbum.UserId + "/" + x.AlbumId + "/" + x.ImageLink
    });

    this.popUpEalbum = true;
  }

  closeEalbumPopup(){
    this.previewAlbum.stopMp3();
    setTimeout(() => {
      this.popUpEalbum = false;
    },50)
    
  }

  publishAlbum() {
    let album = {
      AlbumId: this.ealbumId
    };
    this.albumService.publishAlbumDetail(album)
      .subscribe((data: any) => {
        this.notificationService.showSuccess(GLOBAL_VARIABLE.SUCCESS_MSG_TYPE, GLOBAL_VARIABLE.EALBUM_PUBLISH_MSG)
        setTimeout(() => {
          this.goToMainPage();
        }, 1000)

      },
        error => {

        })
  }

  confirmation(): any {

    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.PUBLISH_CONFIRM_MSG, () => {
      this.publishAlbum();
    }, () => {
      //cancel event
    });
  }


 
}
