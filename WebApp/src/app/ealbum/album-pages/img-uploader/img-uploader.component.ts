import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { from, Observable, ReplaySubject } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { IMG_TYPE, PageViewType } from 'src/app/config/globalvariable';
import * as Compress from 'client-compress';

declare var $: any;

@Component({
  selector: 'app-img-uploader',
  templateUrl: './img-uploader.component.html',
  styleUrls: ['./img-uploader.component.css']
})
export class ImgUploaderComponent implements OnInit {
  @Input() viewtype: any;
  @Input() ismutilple: boolean;
  @Input() pageType: any;
  @Output() attachedImageEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() attachTotalImageEvent: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('fileInput', { static: false }) fileCtrl: ElementRef;
  constructor() { }

  ngOnInit(): void {
  }

  attachedFile(event, viewType) {
    debugger;
    this.attachTotalImageEvent.emit(event.length);
    let imgObservable = from(event)
      .pipe(
        tap(x => console.log('Compress Image', x)),
        mergeMap(x => this.attachImage(x, viewType))
      );

    var details = imgObservable.subscribe(x => {
      this.convertFile(x)
        .subscribe(data => {
          let imgDetail = {
            file: x,
            img64: data
          }
          this.fileCtrl.nativeElement.value = "";
          this.attachedImageEvent.emit(imgDetail);
        });

     
    });

    // if(viewType == PageViewType.Front){
    //   imgObservable.subscribe(x => {
    //     this.createLogoImage(x)
    //       .subscribe(img => {
    //         let imgDetail = {
    //           file: x,
    //           img64: img,
    //           islogo:true
    //         }  
    //         this.attachedImageEvent.emit(imgDetail);
    //       })
    //   })

    // }

  }

  attachImage(file, viewType): Observable<any> {
    let width = 1024;
    if (this.viewtype == IMG_TYPE.Spread) {
      width = 2048;
    }
    const options = {
      targetSize: 0.6,
      quality: 0.80,
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

  convertFile(file: File): Observable<string> {
    const result = new ReplaySubject<string>(1);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => result.next(event.target.result.toString());
    return result;
  }

  titleDisplay(type) {
    let titleDetail = "";

    switch (type) {
      case PageViewType.Back:
        titleDetail = "Back";
        break;
      case PageViewType.Front:
        titleDetail = "Front";
        break;
      case PageViewType.Page:
        titleDetail = "Page";
        break;
      case PageViewType.TPBack:
        titleDetail = "Tp Back";
        break;
      case PageViewType.TPFront:
        titleDetail = "Tp Front";
        break;

    }

    return titleDetail;
  }

  displayMainTitle(type) {
    let titleDetail = "";

    switch (type) {
      case PageViewType.Back:
        titleDetail = "Back";
        break;
      case PageViewType.Front:
        titleDetail = "Front";
        break;
      case PageViewType.Page:
        titleDetail = "Page";
        break;
      case PageViewType.TPBack:
        titleDetail = "Back TP/Page (Optional)";
        break;
      case PageViewType.TPFront:
        titleDetail = "Front TP/Page (Optional)";
        break;

    }

    return titleDetail;
  }

  createLogoImage(file): Observable<any> {
    let width = 76;

    const options = {
      targetSize: 0.5,
      quality: 0.75,
      maxWidth: width,
      maxHeight: 76
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


}
