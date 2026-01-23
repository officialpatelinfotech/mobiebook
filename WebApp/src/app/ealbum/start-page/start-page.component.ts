import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Stepper from 'bs-stepper';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { from, Observable, ReplaySubject } from 'rxjs';
import { IMAGE_TYPE, IMG_TYPE, PageViewType } from 'src/app/config/globalvariable';
import { AlbumImage } from 'src/app/models/addalbum.metadata';
import { Swiper, Navigation, Pagination, Autoplay, EffectFlip, EffectFade } from 'swiper';
import { EalbumService } from '../ealbum.service';
import * as Compress from 'client-compress';
import { mergeMap, tap } from 'rxjs/operators';

import { FormBuilder, FormGroup } from '@angular/forms';
import { RoutingService } from 'src/app/services/routing.service';
import { ColorPickerService } from 'ngx-color-picker';

@Component({
  selector: 'app-start-page',
  templateUrl: './start-page.component.html',
  styleUrls: ['./start-page.component.css']
})
export class StartPageComponent implements OnInit {
  private stepper: Stepper;


  @ViewChild('fileInput', { static: true }) fileCtrl: ElementRef;
  @Input() viewtype;
  @Input() ismutilple;
  @Output() attachedImageEvent: EventEmitter<any> = new EventEmitter<any>();
  @Input() albumdetail;
  imageType = IMAGE_TYPE;
  uploadImageShow = false;
  imageLink: string = "";
  @Input() album;
  pageType = PageViewType;
  public color: string = '#6a0505';
  public color2: string = '#808080';
  albumImages: AlbumImage[] = [];
  public files: Set<File> = new Set();
  selectTemplate:FormGroup;
  templateView =[];
  templateOneView:boolean =false;
  constructor(private albumService: EalbumService,
    private imgResize: Ng2ImgMaxService,
    private cpService: ColorPickerService,
    public vcRef: ViewContainerRef,
    private fb: FormBuilder,
    private routingService: RoutingService,
  ) { 
    this.selectTemplate = this.animationSelect();
  }
  next() {
    this.stepper.next();
  }
  preview() {
    this.stepper.previous();
  }
  ngOnInit(): void {
    this.stepper = new Stepper(document.querySelector('#stepper1'), {
      linear: false,
      animation: true
    });
    this.sliderShow();
    this.templateView  = [
      {id: 1, name: 'template 1'},
      {id: 2, name: 'tempalte 2'},
    ]
   
  }
  ngAfterViewInit(): void {
    debugger;
    if (this.album != undefined) {
      if (this.album.length > 0) {
        this.uploadImageShow = true;
        this.imageLink = this.album[0].ImageLink
      }
    }

  }
  sliderShow() {
    Swiper.use([Navigation, Pagination, Autoplay, EffectFade]);
    const swiper = new Swiper('.swiper-container', {
      spaceBetween: 30,
      centeredSlides: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  }



  displayByte(bytes) {
    return this.albumService.byteFormat(bytes);
  }

  imageAttach(event, viewType) {
    let sortByName = [].slice.call(event).sort((a, b) => (a.name < b.name ? -1 : 1));
    this.defaultRow(sortByName, viewType);
    let imgObservable = from(sortByName)
      .pipe(
        tap(x => console.log('Compress Image', x)),
        mergeMap(x => this.attachImage(x, viewType))
      );


    let clickMethod = this.getDivId();
    var details = imgObservable.subscribe(x => {
      debugger;
      let img = this.albumImages.find(z => z.ImageTitle == x.name);
      if (img != undefined) {
        img.FileDetail = x;
        img.IsAlbumView = true;
        this.convertFile(x)
          .subscribe(data => {
            img.ImageLink = data;

            this.uploadImageShow = true;
            this.imageLink = data;
            this.attachedImageEvent.emit(this.albumImages);
            //  $(clickMethod).click();
          });
      }
      console.log("Console Log", x);
    })
    //}

  }

  defaultRow(images, viewType) {

    //this.albumImages = []
    let clickMethod = this.getDivId();
    let lasteSeq = 0;
    for (let j = 0; j < images.length; j++) {
      let row = images[j];
      let album = new AlbumImage();

      album.ImageLink = "../../../assets/loading.gif";
      album.FileDetail = null;
      album.Progress = 0;
      album.AlbumId = 0;
      album.AlbumPageId = 0;
      if (viewType === PageViewType.Page) {
        // if (this.albumdetail.PageType === IMG_TYPE.Spread) {
        //   album.SequenceNo = j == 0 ? lasteSeq + 1 : lasteSeq + 3;
        //   lasteSeq = album.SequenceNo;
        // }
        // else {
        //   album.SequenceNo = j + 1;
        // }
        album.SequenceNo = j + 1;
        album.IsAlbumView = false;
      }
      else {
        album.SequenceNo = j + 1;
        album.IsAlbumView = false;
      }

      album.ImageSize = "0 KB";
      album.ImageTitle = row.name;
      album.PageViewType = viewType;
      album.UniqId = Date.now().toString();
      album.ParentId = null;


      this.albumImages.push(album);
      this.attachedImageEvent.emit(this.albumImages);
      //   $(clickMethod).click();
    }
  }

  convertFile(file: File): Observable<string> {
    const result = new ReplaySubject<string>(1);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => result.next(event.target.result.toString());
    return result;
  }

  attachedFile(event, viewType) {
    debugger;
    this.imageAttach(event, viewType);
  }



  getDivId() {
    let divId = "";
    if (this.viewtype === this.pageType.Front) {
      divId = "#attachedFrontImg";
    }
    else if (this.viewtype === this.pageType.Back) {
      divId = "#attachedBackImg";
    }
    else if (this.viewtype === this.pageType.Page) {
      divId = "#attachedImg";
    }
    return divId;
  }




  attachImage(file, viewType): Observable<any> {
    let width = 1024;
    if (this.albumdetail.PageType == IMG_TYPE.Spread) {
      width = 2048;
    }
    const options = {
      targetSize: 0.5,
      quality: 0.75,
      maxWidth: width,
      maxHeight: 768
    }
    return new Observable(observer => {
      const compress = new Compress(options)
      compress.compress([file])
        .then((conversion) => {
          const { photo, info } = conversion[0];
          var compressFile = new File([photo.data], file.name, { type: file.type });
          observer.next(compressFile);
          observer.complete();
        })
    });

  }


  imageDivide(file): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      let imgFile = [];
      imgFile.push(new File([file], file.name, { type: file.type }));
      reader.onload = (event) => {
        let canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d'),
          img = new Image();

        img.onload = () => {
          var w2 = img.width / 2,
            h2 = img.height;
          for (let i = 0; i < 2; i++) {
            var x = (-w2 * i) % (w2 * 2),
              y = (h2 * i) <= h2 ? 0 : -h2;

            canvas.width = w2;
            canvas.height = h2;

            ctx.drawImage(img, x, y, w2 * 2, h2);
            canvas.toBlob((blob) => {
              var compressFile = new File([blob], i + "-" + file.name, { type: file.type });
              imgFile.push(compressFile);
              if (i == 1) {
                observer.next(imgFile);
                observer.complete()
              }
            })
          }
        },
          img.onerror = function (error) {
            console.log("image error", error);
          }
        img.src = event.target.result.toString();
      },
        reader.onerror = function (error) {
          console.log('Error: ', error);
        };
      reader.readAsDataURL(file);

    });
  }

  imageCrop(file, uniqId) {
    debugger;
    let attachedFileDetail = this.albumImages;

    const reader = new FileReader();
    reader.onload = (event) => {
      let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        img = new Image();

      img.onload = () => {
        var w2 = img.width / 2,
          h2 = img.height;

        for (let i = 0; i < 2; i++) {
          var x = (-w2 * i) % (w2 * 2),
            y = (h2 * i) <= h2 ? 0 : -h2;

          canvas.width = w2;
          canvas.height = h2;

          ctx.drawImage(img, x, y, w2 * 2, h2);
          canvas.toBlob((blob) => {
            var compressFile = new File([blob], i + "-" + file.name, { type: file.type });
            let album = new AlbumImage();
            album.ImageLink = canvas.toDataURL();
            album.FileDetail = compressFile;
            album.Progress = 0;
            album.AlbumId = 0;
            album.AlbumPageId = 0;
            album.SequenceNo = i + 1;
            album.ImageSize = this.albumService.byteFormat(compressFile.size);
            album.ImageTitle = i + "-" + file.name;
            album.PageViewType = PageViewType.Page;
            album.UniqId = Date.now().toString();
            album.ParentId = uniqId;
            album.IsAlbumView = false;

            attachedFileDetail.push(album);
          })


        }
      },
        img.onerror = function (error) {
          console.log("image error", error);
        }
      img.src = event.target.result.toString();
    },
      reader.onerror = function (error) {
        console.log('Error: ', error);
      };
    reader.readAsDataURL(file);
  }


  removeImage() {
    if (this.album != undefined) {
      if (this.album.length > 0) {
        let val = {
          AlbumPageId: this.album[0].AlbumPageId,
          AlbumId: this.album[0].AlbumId
        }



        this.albumService.deleteAlbumPage(val)
          .subscribe((data: any) => {
            this.album = [];
            this.uploadImageShow = false;
          },
            error => {

            });
      }

    }
    else {
      this.uploadImageShow = false;
    }


  }

tempateOneOpen(){
  this.routingService.routing("/auth/ealbum/template1");
}
tempateOneTwo(){
  this.routingService.routing("/auth/ealbum/template2");
}
  animationSelect(){
    return this.fb.group({
      // eventname: [, [Validators.required]],
      type: [],
      type2: [],
     
    });
  }
}
