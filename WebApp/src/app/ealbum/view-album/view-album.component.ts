import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GLOBAL_VARIABLE, IMG_TYPE, PageViewType } from 'src/app/config/globalvariable';

declare var $: any;
@Component({
  selector: 'app-view-album',
  templateUrl: './view-album.component.html',
  styleUrls: ['./view-album.component.css']
})
export class ViewAlbumComponent implements OnInit {
  @Input() pages;
  @Input() albumdetail;
  @Output() closePopUp = new EventEmitter<boolean>();
  audio = new Audio();
  imageDetail: any[] = [];
  server = GLOBAL_VARIABLE.SERVER_LINK;
  isView: boolean = false;
  constructor() {
    this.isView = true;
  }

  private normalizePageViewType(v: any): string {
    return (v ?? '').toString().trim().toUpperCase();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.albumDisplay();
    }, 1000);

    setTimeout(() => {
      this.runMp3()
    }, 2000);
  }



  albumDisplay() {
    debugger;
    let blankImage = GLOBAL_VARIABLE.DEFAULT_IMG_TP;
    let albums = [];
    let front = this.pages.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.Front);
    let back = this.pages.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.Back);
    if(front != undefined){
      albums.push({ src: front.ImageLink, thumb: front.ImageLink, title: '' })
    }
    else{
      albums.push({ src: blankImage, thumb: blankImage, title: '' })
    }
    

    let frontTp = this.pages.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.TPFront);
    let backTp = this.pages.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.TPBack);
    if (frontTp != undefined) {
      if (this.albumdetail.PageType !== IMG_TYPE.Spread) {
        albums.push({ src: blankImage, thumb: blankImage, title: '' })
      }
      albums.push({ src: frontTp.ImageLink, thumb: frontTp.ImageLink, title: '' })
    }

    const embossPages = (this.pages || []).filter(z =>
      (this.normalizePageViewType(z?.PageViewType) === PageViewType.Emboss)
    );
    if (embossPages.length > 0) {
      embossPages.forEach(p => {
        if (this.albumdetail.PageType !== IMG_TYPE.Spread) {
          albums.push({ src: blankImage, thumb: blankImage, title: '' })
        }
        albums.push({ src: p.ImageLink, thumb: p.ImageLink, title: '' })
      })
    }

    let sortbySequence = [].slice.call(this.pages).sort((a, b) => (a.SequenceNo < b.SequenceNo ? -1 : 1));
    sortbySequence.forEach(element => {
      if (this.normalizePageViewType(element?.PageViewType) === PageViewType.Page
        && element.IsAlbumView == true) {
        albums.push({ src: element.ImageLink, thumb: element.ImageLink, title: '' })
      }

    });

    if (backTp != undefined) {
      if (this.albumdetail.PageType !== IMG_TYPE.Spread) {
        albums.push({ src: blankImage, thumb: blankImage, title: '' })
      }
      albums.push({ src: backTp.ImageLink, thumb: backTp.ImageLink, title: '' })
    }

    if(back != undefined){
      albums.push({ src: back.ImageLink, thumb: back.ImageLink, title: '' });
    }
    else{
      albums.push({ src: blankImage, thumb: blankImage, title: '' });
    }
   

    setTimeout(() => {
      $("#container").flipBook({
        pages: albums,
        viewMode: '3d',
        btnDownloadPages: { enabled: false },
        btnDownloadPdf: { enabled: false },
        btnBookmark: { enabled: false },
        btnPrint: { enabled: false },
        btnToc: { enabled: false },
        btnSelect: { enabled: false },
        //  lightBox:true,
        // lightboxBackground:'rgba(220,225,229,1)',
        // lightBox:true,
        //  lightBoxOpened:true,
        icons: 'material',
        lightIntensity: .6,
        lightPositionY: 400,
        shadowOpacity: .4,
        backgroundColor: "#150000",
        // skin:"gradient",
        pageFlipDuration: 2,
        deeplinking: {
          enabled: true,
          prefix: ""
        },
        skin: "dark",
        //zoomMin:1     
      });
    });

  }


  runMp3() {
    debugger;
    this.audio.src = this.server + "Resources/Mp3Files/" + this.albumdetail.Mp3Link;
    this.audio.load();
    this.audio.loop = true;
    this.audio.play();
  }

  stopMp3() {
    this.audio.loop = false;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  closeEalbumPopup() {
    this.stopMp3();
    setTimeout(() => {
      this.closePopUp.emit();
    }, 500);
  }
}
