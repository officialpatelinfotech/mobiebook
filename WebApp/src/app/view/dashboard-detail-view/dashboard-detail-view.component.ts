import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClipboardService } from 'ngx-clipboard';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { EalbumService } from 'src/app/ealbum/ealbum.service';
import { CommonService } from 'src/app/services/common.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';
import { ConfimationService } from 'src/app/shared/confimation.service';

@Component({
  selector: 'app-dashboard-detail-view',
  templateUrl: './dashboard-detail-view.component.html',
  styleUrls: ['./dashboard-detail-view.component.css']
})
export class DashboardDetailViewComponent implements OnInit {
  code:string;
  ealbumDetail:any[] = [];
  popUpEalbum: boolean = false;
  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/";
  
  constructor(
    private commonService: CommonService,
    private activeRouter: ActivatedRoute,
    private routingService: RoutingService,
    private albumService: EalbumService,
    @Inject(DOCUMENT) private readonly document: any,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfimationService,
  ) { }

  ngOnInit(): void {
    this.activeRouter.params.subscribe((param: any) => {

      // tslint:disable-next-line: triple-equals
      if (param.id != undefined) {
        this.code = param.id;   
        this.getDashboardDetail();     
      }
    });
  }

  getDashboardDetail = () =>{
    this.commonService.getDashboardDetailView(this.code)
        .subscribe(x => {
          
          this.ealbumDetail = x.ViewAlbums;
        },
        error => {
          console.log(error);
        });
  }

  addClassStatus(status) {

    let statusClass = "";

    switch (status) {
      case "OPEN":
        statusClass = "ribbon-open";
        break;
      case "PUBLISHED":
        statusClass = "ribbon-PUBLISHED";
        break;
    }

    return statusClass
  }

  edit(album) {
    this.routingService.routingQuery('auth/ealbum/edit-album/' + album.EAlbumId,{step:1});
  }

  albumPages: any[] =[];
  viewAlbum: any;
  getAlbumPages(album) {
    this.albumService.getAlbumPageDetail(album.EAlbumId)
      .subscribe((data: any) => {
        this.albumPages = data;
        this.viewAlbum = album;
        
        this.albumPages.forEach(x => {
          x.ImageLink = this.serverLink + this.viewAlbum.UserId + "/" + x.AlbumId + "/" + x.ImageLink
        })

        this.popUpEalbum = true;
      },
        error => {

        });
  }

  shareOnWhatsapp(detail){
    this.copy(detail);
    setTimeout(() => {
      window.open("https://web.whatsapp.com/", "_blank");
    }, 100);
   
  }

  copy(detail){    
    let url =this.document.location.origin;
    this.clipboardService.copyFromContent(url+"/#/ealbum/validate/"+detail.EAlbumId+"/"+detail.UniqId);
    
    setTimeout(() => {
      this.notificationService.showSuccess("Link Copied",GLOBAL_VARIABLE.SUCCESS);
    },500)
  
  }

  deleteConfirm(c) {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.DELETE_CONFIRM_MESSAGE, () => {
      this.deleteAlbum(c);
    }, () => {
      //cancel event
    });
  }

  deleteAlbum(album){
    let pages = {
      AlbumPageId: 0,
      AlbumId:album.EAlbumId
    }
    this.albumService.deleteAlbumDetail(pages)
        .subscribe((data: any) => {
            this.getDashboardDetail();
        },
        error => {

        });
  }

  publishConfirm(detail) {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.PUBLISH_CONFIRM_MSG, () => {
      this.publishAlbum(detail);
    }, () => {
      //cancel event
    });
  }

  publishAlbum(detail) {
    let album = {
      AlbumId: detail.EAlbumId
    };
    this.albumService.publishAlbumDetail(album)
      .subscribe((data: any) => {
        this.notificationService.showSuccess(GLOBAL_VARIABLE.SUCCESS_MSG_TYPE, GLOBAL_VARIABLE.EALBUM_PUBLISH_MSG)
        setTimeout(() => {
            detail.Status = 'PUBLISHED'
        }, 1000)

      },
        error => {

        })
  }



}
