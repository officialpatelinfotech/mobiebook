import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { GLOBAL_VARIABLE, PageViewType } from 'src/app/config/globalvariable';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { AlbumService } from 'src/app/view-album/album.service';
import { EalbumService } from '../../ealbum.service';

@Component({
  selector: 'app-ealbum-cover',
  templateUrl: './ealbum-cover.component.html',
  styleUrls: ['./ealbum-cover.component.css']
})
export class EalbumCoverComponent implements OnInit, OnDestroy {
  isPublished: boolean = false;
  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/";

  pageType = PageViewType;
  @Output() saveCoverEvent = new EventEmitter<any>();

  @Input() ealbumId;
  @Input() imgType;

  ealbumDetail: any;

  attachedImageDetail: any[] = [];

  frontImage: any = "";
  frontImgTitle: any = "";
  backImage: any = "";
  backImgTitle: any = "";
  tpFrontImage: any = "";
  tpBackImage: any = ""

  tpSheetFront: any = "";
  tpSheetBack: any = "";
  tpSheetFrontTitle: any = "";
  tpSheetBackTitle: any = "";

  viewAlbum: any;
  logoImage: any;

  constructor(
    private fileUpload: FileUploadService,
    private albumService: EalbumService
  ) { }

  ngOnInit(): void {

    setTimeout(() => {
      this.getAlbumPages();
    }, 100);
  }

  previous() {
    this.saveCoverEvent.emit({ status: "done", moveto: GLOBAL_VARIABLE.PREVIOUS });
  }

  logoFile = [];
  attachedFile(fileDetail, pageType) {
    debugger;
    if (fileDetail.file != undefined) {
      if (fileDetail.islogo != true) {
        this.attachedImageDetail.push({
          ImageDetail: fileDetail.file,
          PageType: pageType,
          Progress: 0,
          ImageLink: fileDetail.img64,
          ImageName: fileDetail.file.name
        });

      }

      this.displayImage();
    }
  }

  saveCover() {
    //this.uploadIcons();
    for (let i = 0; i < this.attachedImageDetail.length; i++) {
      let imgRow = this.attachedImageDetail[i];
      if (imgRow.ImageDetail != null) {
        const formData: FormData = new FormData();
        formData.append('file', imgRow.ImageDetail, imgRow.ImageDetail.name);
        formData.append('albumid', this.ealbumId.toString());
        formData.append('pagetype',  this.viewAlbum.PageType);
        formData.append('viewtype', imgRow.PageType);
        formData.append('size', this.albumService.byteFormat(imgRow.ImageDetail.size));
        formData.append('sequenceno', (i + 1).toString());
        formData.append('uniqid', Date.now().toString());
        formData.append('parentid', "");
        formData.append('isdisplay', 'true');

        this.fileUpload.upload(formData, "api/EAlbum/AcUploadImage").subscribe(
          event => {
            if (event.type === HttpEventType.UploadProgress) {
              imgRow.Progress = Math.round(100 * event.loaded / event.total);
            } else if (event instanceof HttpResponse) {
              if (i == this.attachedImageDetail.length - 1) {
                this.saveCoverEvent.emit({ status: "done", moveto: GLOBAL_VARIABLE.NEXT });
              }
            }
          },
          err => {
            imgRow.Progress = 0;
          });
      }
      else {
        if (i == this.attachedImageDetail.length - 1) {
          this.saveCoverEvent.emit({ status: "done", moveto: GLOBAL_VARIABLE.NEXT });
        }
      }

    }
  }

  displayImage() {

    let front = this.attachedImageDetail.find(x => x.PageType == this.pageType.Front);
    if (front != undefined) {
      this.frontImage = front.ImageLink;
      this.frontImgTitle = front.ImageName;
    }
    let back = this.attachedImageDetail.find(x => x.PageType == this.pageType.Back);
    if (back != undefined) {
      this.backImage = back.ImageLink
      this.backImgTitle = back.ImageName;
    }

    let frontTp = this.attachedImageDetail.find(x => x.PageType == this.pageType.TPFront);
    if (frontTp != undefined) {
      this.tpFrontImage = frontTp.ImageLink;
      this.tpSheetFrontTitle = frontTp.ImageName;
    }

    let backTp = this.attachedImageDetail.find(x => x.PageType == this.pageType.TPBack);
    if (backTp != undefined) {
      this.tpBackImage = backTp.ImageLink;
      this.tpSheetBackTitle = backTp.ImageName;
    }
  }

  removeImage(pageType) {
    let pageId = 0;
    if (pageType === this.pageType.Back) {
      this.backImgTitle = "";
      this.backImage = "";
      let img = this.attachedImageDetail.find(x => x.PageType == this.pageType.Back);
      if (img != undefined) {
        pageId = img.AlbumPageId;
        this.remove(img, 0);
        this.attachedImageDetail = this.attachedImageDetail.filter(x => x.PageType != this.pageType.Back);
      }
    }

    if (pageType === this.pageType.Front) {
      this.frontImage = "";
      this.frontImgTitle = "";
      let img = this.attachedImageDetail.find(x => x.PageType == this.pageType.Front);
      if (img != undefined) {
        pageId = img.AlbumPageId;
        this.remove(img, 0);
        this.attachedImageDetail = this.attachedImageDetail.filter(x => x.PageType != this.pageType.Front);
      }
    }

    if (pageType === this.pageType.TPFront) {
      this.tpFrontImage = "";
      this.tpSheetFrontTitle = "";
      
      let img = this.attachedImageDetail.find(x => x.PageType == this.pageType.TPFront);
      if (img != undefined) {
        pageId = img.AlbumPageId;
        this.remove(img, 0);
        this.attachedImageDetail = this.attachedImageDetail.filter(x => x.PageType != this.pageType.TPFront);
      }
    }

    if (pageType === this.pageType.TPBack) {
      this.tpBackImage = "";
      this.tpSheetBackTitle = "";
      let img = this.attachedImageDetail.find(x => x.PageType == this.pageType.TPBack);
      if (img != undefined) {
        pageId = img.AlbumPageId;
        this.remove(img, 0);
        this.attachedImageDetail = this.attachedImageDetail.filter(x => x.PageType != this.pageType.TPBack);
      }
    }
  }

  remove(f, i) {
    debugger;
    if (f.AlbumPageId > 0) {
      let val = {
        AlbumPageId: f.AlbumPageId,
        AlbumId: this.ealbumId
      }

      this.albumService.deleteAlbumPage(val)
        .subscribe((data: any) => {
          this.attachedImageDetail = this.attachedImageDetail.filter(x => x.AlbumPageId != f.AlbumPageId);
        },
          error => {

          });
    }
  }

  removeExtension(imgName) {
    let im = imgName.split('.');
    if (im.length > 0) {
      return im[0];
    }
  }

  getAlbumPages() {
    let api = of(this.ealbumId)
      .pipe(
        mergeMap(x => {
          let ealbumResp = this.albumService.getAlbumDetailById(this.ealbumId)
          let ealbumPageResp = this.albumService.getAlbumPageDetail(this.ealbumId)
          return forkJoin([ealbumResp, ealbumPageResp])
        })
      ).subscribe((data: any) => {
        debugger;
        this.viewAlbum = data[0];
        let pages = data[1];
        if (pages.length == 0)
          return;

        let front = pages.find(x => x.PageViewType == this.pageType.Front);
        let back = pages.find(x => x.PageViewType == this.pageType.Back);

        this.attachedImageDetail = []
        if (front != null) {
          this.attachedImageDetail.push({
            ImageDetail: null,
            PageType: this.pageType.Front,
            Progress: 0,
            ImageLink: this.serverLink + this.viewAlbum.UserId + "/" + this.ealbumId + "/" + front.ImageLink,
            ImageName: front.ImageLink,
            AlbumPageId: front.AlbumPageId
          });
        }

        if (back != null) {
          this.attachedImageDetail.push({
            ImageDetail: null,
            PageType: this.pageType.Back,
            Progress: 0,
            ImageLink: this.serverLink + this.viewAlbum.UserId + "/" + this.ealbumId + "/" + back.ImageLink,
            ImageName: back.ImageLink,
            AlbumPageId: back.AlbumPageId
          });
        }

        let tpFront = pages.find(x => x.PageViewType == this.pageType.TPFront);
        let tpBack = pages.find(x => x.PageViewType == this.pageType.TPBack);

        if (tpFront != undefined) {
          this.attachedImageDetail.push({
            ImageDetail: null,
            PageType: this.pageType.TPFront,
            Progress: 0,
            ImageLink: this.serverLink + this.viewAlbum.UserId + "/" + this.ealbumId + "/" + tpFront.ImageLink,
            ImageName: tpFront.ImageLink,
            AlbumPageId: tpFront.AlbumPageId
          });
        }

        if (tpBack != undefined) {
          this.attachedImageDetail.push({
            ImageDetail: null,
            PageType: this.pageType.TPBack,
            Progress: 0,
            ImageLink: this.serverLink + this.viewAlbum.UserId + "/" + this.ealbumId + "/" + tpBack.ImageLink,
            ImageName: tpBack.ImageLink,
            AlbumPageId: tpBack.AlbumPageId
          });
        }

        this.displayImage();


      },
        error => {

        });


  }

  // uploadIcons() {
  //   for (let i = 0; i < this.logoFile.length; i++) {
  //     let imgRow = this.logoFile[i];
  //     const formData: FormData = new FormData();
  //     formData.append('file', imgRow.ImageDetail, imgRow.ImageDetail.name);
  //     formData.append('albumid', this.ealbumId.toString());
  //     this.fileUpload.upload(formData, "api/EAlbum/AcUploadIcons").subscribe(
  //       event => {

  //       },
  //       err => {
  //         imgRow.Progress = 0;
  //       });
  //   }
  // }


  ngOnDestroy(){
    this.attachedImageDetail = [];
  }
}
