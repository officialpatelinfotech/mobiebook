import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ClipboardService } from 'ngx-clipboard';
import { GLOBAL_VARIABLE, ViewAlbumStatus } from 'src/app/config/globalvariable';
import { ViewAlbumMetaData } from 'src/app/models/viewalbum.metadata';
import { RoutingService } from 'src/app/services/routing.service';
import { EalbumService } from '../ealbum.service';
import { DOCUMENT } from '@angular/common';
import { ConfimationService } from 'src/app/shared/confimation.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { Utilities } from 'src/app/config/utility';


@Component({
  selector: 'app-manage-ealbum',
  templateUrl: './manage-ealbum.component.html',
  styleUrls: ['./manage-ealbum.component.css']
})
export class ManageEalbumComponent implements OnInit {

  @ViewChild("container") containerDetail: ElementRef;
  albums: ViewAlbumMetaData[] = [];
  totalRecord: any = 0;
  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/";
  albumPages: any[] = [];
  viewAlbum: any;
  AlbumByStatus: any[] = ViewAlbumStatus;
  defaultStatus: string = "OPEN";
  searchText: string = "";
  isAllowToAdd: boolean = false;

  popUpEalbum: boolean = false;
  constructor(
    private routingService: RoutingService,
    private albumService: EalbumService,
    private confirmDialogService: ConfimationService,
    private clipboardService: ClipboardService,
    private router: Router,
    @Inject(DOCUMENT) private readonly document: any,
    private localStoreService: LocalstoreService,
    private notificationService: NotificationService
  ) {
    this.getAlbumDetail();
    this.localStoreService.removeByKey("ealbumId");
  }

  ngOnInit(): void {

      this.isAllowToAdd  = this.albumService.isAllowToAddAlbum();
  }

  addAlbum() {
    this.routingService.routingQuery('auth/ealbum/add-album', { step: 1 });
  }

  pageIndex = 1;
  PageSize = 20;
  getAlbumDetail() {
    
    let page = {
      PageIndex: this.pageIndex,
      PageSize: this.PageSize,
      FilterString: this.searchText,
      Status: this.defaultStatus
    };

    this.albumService.acAlbums(page)
      .subscribe((data: any) => {

        this.totalRecord = data.TotalRecord;
        this.albums = data.ViewAlbums;
      },
        error => {
          this.totalRecord = 0;
          this.albums = [];
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        });
  }

  edit(album) {
    this.routingService.routingQuery('auth/ealbum/edit-album/' + album.EAlbumId, { step: 1 });
  }


  openEalbumPopup() {
    this.popUpEalbum = true;

  }
  closeEalbumPopup() {
    this.popUpEalbum = false;
  }

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
          this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
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

  deleteConfirm(c) {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.DELETE_CONFIRM_MESSAGE, () => {
      this.deleteAlbum(c);
    }, () => {
      //cancel event
    });
  }

  deleteAlbum(album) {
    let pages = {
      AlbumPageId: 0,
      AlbumId: album.EAlbumId
    }
    this.albumService.deleteAlbumDetail(pages)
      .subscribe((data: any) => {
        this.getAlbumDetail();
      },
        error => {

        });
  }


  copy(detail) {
    let url = this.document.location.origin;
    let userDetail = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL));

    // let urlMain = "https://api.mobiebook.online/resources/"+userDetail.UserId+"/"+detail.EAlbumId+"/index.html?id="+detail.UniqId;
    //this.clipboardService.copyFromContent(url+"/#/ealbum/validate/"+detail.EAlbumId+"/"+detail.UniqId);
    let urlMain = url + "/#/?q=" + detail.UniqId;
    this.clipboardService.copyFromContent(urlMain);
    setTimeout(() => {
      this.notificationService.showSuccess("Link Copied", GLOBAL_VARIABLE.SUCCESS);
    }, 500)

  }

  shareOnWhatsapp(detail) {
    this.copy(detail);
    setTimeout(() => {
      
      //window.open("https://web.whatsapp.com/", "_blank");
    }, 100);

  }
  addtempalte() {
    this.routingService.routing("/auth/ealbum/addtemplate");
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


  selectChange(event) {
    this.totalRecord = 0;
    this.pageIndex = 1;
    this.PageSize = 20;
    this.defaultStatus = event;
    this.getAlbumDetail();
  }

  searchChange(event) {
    this.searchText = event;
    this.pageIndex =  1;
    this.getAlbumDetail();
  }

  onChangePage(event) {
    debugger;
    this.pageIndex = event;
    //this.PageSize = event.pageSize;
    this.getAlbumDetail();
  }

  stringLimit(val:string) {
    return Utilities.stringLenghtLimit(val,10);
  }

}
