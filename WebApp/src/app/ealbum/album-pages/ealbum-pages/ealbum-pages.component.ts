import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { forkJoin, from, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { GLOBAL_VARIABLE, PageViewType } from 'src/app/config/globalvariable';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ConfimationService } from 'src/app/shared/confimation.service';
import { EalbumService } from '../../ealbum.service';

declare var alphaNumericSort: Function;

@Component({
  selector: 'app-ealbum-pages',
  templateUrl: './ealbum-pages.component.html',
  styleUrls: ['./ealbum-pages.component.css']
})
export class EalbumPagesComponent implements OnInit {
  isPublished: boolean = false;
  pageType = PageViewType;
  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/";
  containerClass = "col-md-2";
  widthClass = "";
  swapText = "Swap"
  isSwap = false;

  @Output() savePageEvent = new EventEmitter<any>();
  @Input() ealbumId;
  @Input() imgType;

  attachedImageDetail: any[] = [];
  viewAlbum: any;
  isClick: boolean = false;

  imageCount: any = 0;
  constructor(
    private fileUpload: FileUploadService,
    private albumService: EalbumService,
    private confirmDialogService: ConfimationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.getAlbumPages();
    }, 100);
  }

  totalImage = (img) => {
    this.imageCount = img;
  }

  isDisplay: any = false;
  attachedFile(fileDetail, pageType) {

    if (fileDetail.file != undefined) {
      this.attachedImageDetail.push({
        ImageDetail: fileDetail.file,
        PageType: pageType,
        Progress: 0,
        ImageLink: fileDetail.img64,
        FileName: this.removeExtension(fileDetail.file.name),
        IsUpload: true,
        AlbumPageId: 0,
        SequenceNo: 0
      });

      if (this.imageCount == this.attachedImageDetail.length) {
        debugger;
        this.changeSequence();
        this.isDisplay = true;
      }

    }
  }

  changeSequence() {

    let imgName = this.attachedImageDetail.map(x => x.FileName);
    alphaNumericSort(imgName)
    debugger;
    for(let i=0; i < imgName.length;i++){
      let row = imgName[i];
      let img = this.attachedImageDetail.find(x => x.FileName == row);
      if(img != undefined){
        img.SequenceNo = i + 1;
      }
    }

    this.isDisplay  = false;

    this.attachedImageDetail = [].slice.call(this.attachedImageDetail).sort((a, b) => (a.SequenceNo < b.SequenceNo ? -1 : 1));

    setTimeout(() => {
      this.isDisplay  = true;
    },50)
    // this.attachedImageDetail = this.attachedImageDetail;  // [].slice.call(this.attachedImageDetail).sort(Intl.Collator().compare, (a, b) => (a.FileName < b.FileName ? -1 : 1));
    // let seq = 1;
    // this.attachedImageDetail.forEach(x => {
    //   x.SequenceNo = seq;
    //   seq = seq + 1;
    // })
    console.log(this.attachedImageDetail)
  }

  

  savePages() {
    let totalImg = this.attachedImageDetail.length % 2;
    if (totalImg != 0 && this.imgType != "Spread") {
      this.notificationService.showError("Image count should be even for pages", GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
      return;
    }

    let uploadImages = this.attachedImageDetail.filter(x => x.IsUpload == true);
    let uploadImagesSeq = this.attachedImageDetail.filter(x => x.IsUpload != true);
    if (uploadImagesSeq.length > 0) {
      let seqDetail = []
      uploadImagesSeq.forEach(x => {
        seqDetail.push({
          AlbumId: this.ealbumId,
          PageId: x.AlbumPageId,
          SequenceNo: x.SequenceNo
        });
      });

      if (seqDetail.length > 0) {
        this.albumService.acUpdateAlbumSequence(seqDetail)
          .subscribe((data: any) => {
            if (uploadImagesSeq.length == this.attachedImageDetail.length) {
              this.savePageEvent.emit({ status: "done", moveto: GLOBAL_VARIABLE.NEXT });
            }
            console.log("sequence update")
          },
            error => {
              console.log(error);
            });
      }
    }
    if (this.isClick == false) {
      for (let i = 0; i < uploadImages.length; i++) {
        this.isClick = true;
        try {
          let imgRow = uploadImages[i];

          const formData: FormData = new FormData();
          formData.append('file', imgRow.ImageDetail, imgRow.ImageDetail.name);
          formData.append('albumid', this.ealbumId.toString());
          formData.append('pagetype', this.imgType);
          formData.append('viewtype', imgRow.PageType);
          formData.append('size', this.albumService.byteFormat(imgRow.ImageDetail.size));
          formData.append('sequenceno', (imgRow.SequenceNo).toString());
          formData.append('uniqid', Date.now().toString());
          formData.append('parentid', "");
          formData.append('isdisplay', 'true');

          this.fileUpload.upload(formData, "api/EAlbum/AcUploadImage").subscribe(
            event => {
              if (event.type === HttpEventType.UploadProgress) {
                imgRow.Progress = Math.round(100 * event.loaded / event.total);
              } else if (event instanceof HttpResponse) {
                if (i == uploadImages.length - 1) {
                  this.savePageEvent.emit({ status: "done", moveto: GLOBAL_VARIABLE.NEXT });
                  this.isClick = false;
                }
              }
            },
            err => {
              this.isClick = false;
              imgRow.Progress = 0;
            });
        }
        catch (ex) {
          this.isClick = false;
        }

      }
    }


  }

  removeExtension(imgName) {
    let im = imgName.split('.');
    if (im.length > 0) {
      return im[0];
    }
  }

  drop(event: CdkDragDrop<string[]>) {

    if (event.previousContainer === event.container) {

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      let i = 1;
      this.attachedImageDetail.forEach(x => {
        if (i >= event.currentIndex) {
          x.SequenceNo = i;
        }
        i++;
      });

    } else {

    }
  }

  remove(f, i) {
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
    else {
      const index = this.attachedImageDetail.indexOf(i);
      this.attachedImageDetail.splice(i, 1);
    }
  }

  previous() {
    this.savePageEvent.emit({ status: "done", moveto: GLOBAL_VARIABLE.PREVIOUS });
  }

  getAlbumPages() {
    debugger;
    let api = of(this.ealbumId)
      .pipe(
        mergeMap(x => {
          let ealbumResp = this.albumService.getAlbumDetailById(this.ealbumId)
          let ealbumPageResp = this.albumService.getAlbumPageDetail(this.ealbumId)
          return forkJoin([ealbumResp, ealbumPageResp])
        })
      ).subscribe((data: any) => {
        this.viewAlbum = data[0];

        this.imgType = this.viewAlbum.PageType;
        let pages = data[1];
        this.attachedImageDetail = []
        if (pages.length == 0)
          return;

        pages = [].slice.call(pages).sort((a, b) => (a.SequenceNo < b.SequenceNo ? -1 : 1));
        pages.forEach(element => {
          if (element.PageViewType === this.pageType.Page) {
            this.attachedImageDetail.push({
              ImageDetail: null,
              PageType: this.pageType.Page,
              Progress: 100,
              ImageLink: this.serverLink + this.viewAlbum.UserId + "/" + this.ealbumId + "/" + element.ImageLink,
              FileName: this.removeExtension(element.ImageLink),
              IsUpload: false,
              AlbumPageId: element.AlbumPageId,
              SequenceNo: element.SequenceNo
            });
          }
        });
        this.isDisplay = true


      },
        error => {

        });
  }

  swap() {
    if (this.isSwap == true) {
      this.containerClass = "col-sm-2"
      this.widthClass = ""
      this.swapText = "Swap"
      this.isSwap = false;
      // let uploadImagesSeq = this.attachedImageDetail.filter(x => x.IsUpload != true);
      // if (uploadImagesSeq.length > 0) {
      //   let seqDetail = []
      //   uploadImagesSeq.forEach(x => {
      //     seqDetail.push({
      //       AlbumId: this.ealbumId,
      //       PageId: x.AlbumPageId,
      //       SequenceNo: x.SequenceNo
      //     });
      //   });

      //   if (seqDetail.length > 0) {
      //     this.albumService.acUpdateAlbumSequence(seqDetail)
      //       .subscribe((data: any) => {
      //       },
      //         error => {
      //           console.log(error);
      //         });
      //   }
      // }
    }
    else {
      this.containerClass = "col-sm-4 offset-sm-4"
      // this.widthClass = "swap-detail"
      this.swapText = "Done"
      this.isSwap = true;
    }
    // this.albumService.contentDetail(this.attachedImageDetail, () => {
    //   this.getAlbumPages();
    // }, () => {
    //   //cancel event
    // });
  }

  removeAll() {
    let i = 0;
    from(this.attachedImageDetail)
    .pipe(
      map(x =>  {this.remove(x, i); i++})
    )
    .subscribe((data:any) => {
      // this.remove(data, i);
      // i++;
    })
    // this.attachedImageDetail.forEach(x => {
     
    // })
  }

}
