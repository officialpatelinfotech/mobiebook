import {
  AfterViewInit,
  Component, ElementRef, EventEmitter, Input,
  OnInit, Output, ViewChild
} from '@angular/core';
import { AlbumImage } from 'src/app/models/addalbum.metadata';
import Compressor from 'compressorjs';
import { GLOBAL_VARIABLE, IMAGE_TYPE, IMG_TYPE, PageViewType } from 'src/app/config/globalvariable';
import { EalbumService } from '../ealbum.service';
import { from, Observable, ReplaySubject } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';


import * as Compress from 'client-compress';


declare var $: any;

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.css']
})
export class UploaderComponent implements OnInit, AfterViewInit {

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

  albumImages: AlbumImage[] = [];
  public files: Set<File> = new Set();
  constructor(
    private albumService: EalbumService
  ) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void{
    debugger;
    if( this.album != undefined){
      if(this.album.length > 0){
        this.uploadImageShow = true;
        this.imageLink = this.album[0].ImageLink
      }
    }
   
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
              $(clickMethod).click();
            });
        }
        console.log("Console Log", x);
      })
    //}

  }

  defaultRow(images, viewType) {
    
    //this.albumImages = []
    let attachedImg = 0;
    let count = this.albumImages.filter(x => x.PageViewType === PageViewType.Page);

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
        album.SequenceNo = j + 1 + count.length;
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
      $(clickMethod).click();
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
    if(this.albumdetail.PageType == IMG_TYPE.Spread){
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
        .then((conversion) =>{
          const { photo,info} = conversion[0];
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
    if(this.album != undefined){
      if(this.album.length > 0){ 
        let val= {
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
}
