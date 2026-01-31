import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { GLOBAL_VARIABLE, IMG_TYPE, PageViewType } from 'src/app/config/globalvariable';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { RoutingService } from 'src/app/services/routing.service';
import { AlbumService } from '../album.service';

declare var $: any;

@Component({
  selector: 'app-show-album',
  templateUrl: './show-album.component.html',
  styleUrls: ['./show-album.component.css']
})
export class ShowAlbumComponent implements OnInit {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  albumDetail: any;
  server = GLOBAL_VARIABLE.SERVER_LINK;
  pageDetail: any;
  isView: boolean = false;
  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/";
  audio = new Audio();
  imageDetail: any[] = [];
  private flipbook: any;


  constructor(
    private localStoreService: LocalstoreService,
    private routingService: RoutingService,
    private albumService: AlbumService,
    private titleService: Title

  ) {
    if (localStoreService.getItem('albumdetail') == undefined) {
      localStoreService.clearAll();
      routingService.routing('/');

    }
    else {
      this.albumDetail = JSON.parse(localStoreService.getItem('albumdetail'))
      this.titleService.setTitle(this.albumDetail.CoupleDetail);
    }

  }

  ngOnInit(): void {
    this.getAlbumDetail();
  }

  private normalizePageViewType(v: any): string {
    return (v ?? '').toString().trim().toUpperCase();
  }

  getAlbumDetail() {
    this.albumService.getAlbumPageDetail(this.albumDetail.EAlbumId)
      .subscribe((data: any) => {
        this.isView = true;
        this.pageDetail = data;

        const pageTypes = Array.from(new Set(
          (this.pageDetail || []).map(p => this.normalizePageViewType(p?.PageViewType)).filter(Boolean)
        ));
        const embossCount = (this.pageDetail || []).filter(p =>
          this.normalizePageViewType(p?.PageViewType) === PageViewType.Emboss
        ).length;
        // Debug helper: if EMBOSS isn't in the API response, the UI cannot display it.
        if (embossCount === 0) {
          console.log('[MobieBook][EMBOSS] Not present in GetAlbumPageDetail response', {
            albumId: this.albumDetail?.EAlbumId,
            pageViewTypes: pageTypes
          });
        } else {
          console.log('[MobieBook][EMBOSS] Present in GetAlbumPageDetail response', {
            albumId: this.albumDetail?.EAlbumId,
            embossCount,
            pageViewTypes: pageTypes
          });
        }

        this.pageDetail.forEach(x => {
          x.ImageLink = this.serverLink + this.albumDetail.UserId + "/" + x.AlbumId + "/" + x.ImageLink
        })

        this.albumDisplay();
      },
        error => {

        })
  }

  albumDisplay() {
    let albums = []
    let blankImage = GLOBAL_VARIABLE.DEFAULT_IMG_TP;
    let front = this.pageDetail.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.Front);
    let back = this.pageDetail.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.Back);
    if(front != undefined){
      albums.push({ src: front.ImageLink, thumb: front.ImageLink, title: '' })
    }
    else{
      albums.push({ src: blankImage, thumb: blankImage, title: '' })
    }

    let frontTp = this.pageDetail.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.TPFront);
    let backTp = this.pageDetail.find(z => this.normalizePageViewType(z?.PageViewType) === PageViewType.TPBack);
    if (frontTp != undefined) {
      if (this.albumDetail.PageType !== IMG_TYPE.Spread) {
        albums.push({ src: blankImage, thumb: blankImage, title: '' })
      }
      albums.push({ src: frontTp.ImageLink, thumb: frontTp.ImageLink, title: '' })
    }

    const embossPages = (this.pageDetail || []).filter(z =>
      (this.normalizePageViewType(z?.PageViewType) === PageViewType.Emboss)
    );
    if (embossPages.length > 0) {
      embossPages.forEach(p => {
        if (this.albumDetail.PageType !== IMG_TYPE.Spread) {
          albums.push({ src: blankImage, thumb: blankImage, title: '' })
        }
        albums.push({ src: p.ImageLink, thumb: p.ImageLink, title: '' })
      })
    }

    let sortbySequence = [].slice.call(this.pageDetail).sort((a, b) => (a.SequenceNo < b.SequenceNo ? -1 : 1));
    sortbySequence.forEach(element => {
      if (this.normalizePageViewType(element?.PageViewType) === PageViewType.Page
        && element.IsAlbumView == true) {
        albums.push({ src: element.ImageLink, thumb: element.ImageLink, title: '' })
      }

    });

    if (backTp != undefined) {
      if (this.albumDetail.PageType !== IMG_TYPE.Spread) {
        albums.push({ src: blankImage, thumb: blankImage, title: '' })
      }
      albums.push({ src: backTp.ImageLink, thumb: backTp.ImageLink, title: '' })
    }

    if(back != undefined){
      albums.push({ src: back.ImageLink, thumb: back.ImageLink, title: '' });
    }
    else{
      albums.push({ src: blankImage, thumb: blankImage, title: '' })
    }
   


    setTimeout(() => {
      const $container = $(this.containerRef?.nativeElement);
      if (!$container || $container.length === 0) {
        return;
      }

      try {
        if (this.flipbook && typeof this.flipbook.dispose === 'function') {
          this.flipbook.dispose();
        }
      } catch {
        // ignore
      }
      $container.empty();

      this.flipbook = $container.flipBook({
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
        // IMPORTANT: app uses HashLocationStrategy, so flipBook hash deeplinking
        // breaks Angular routing.
        deeplinking: {
          enabled: false
        },
        skin: "dark"
      });

      this.runMp3();
    });

  }

  closeEalbumPopup() {
    //this.localStoreService.clearAll();
    this.stopMp3();
    ///this.routingService.routing('/');
    setTimeout(() => {
      this.loseWP();
    }, 100);
  }


  runMp3() {
    const mp3 = (this.albumDetail?.Mp3Link ?? '').toString().trim();
    if (!mp3) {
      return;
    }
    this.audio.src = this.server + "Resources/Mp3Files/" + mp3;
    this.audio.load();
    this.audio.loop = true;
    const p = this.audio.play();
    if (p && typeof (p as any).catch === 'function') {
      (p as any).catch(() => {});
    }
  }

  stopMp3() {
    this.audio.loop = false;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  loseWP() {
    //let oldUrl =  this.localStoreService.getItem('oldurl')
    this.routingService.routingQuery("/ealbum/complete",{id:this.albumDetail.UniqId});
    //   var Browser = navigator.appName;
    //   var indexB = Browser.indexOf('Explorer');

    //   if (indexB > 0) {
    //      var indexV = navigator.userAgent.indexOf('MSIE') + 5;
    //      var Version = navigator.userAgent.substring(indexV, indexV + 1);

    //      if (parseInt(Version) >= 7) {
    //          window.open('', '_self', '');
    //          window.close();
    //      }
    //      else if (parseInt(Version) == 6) {
    //          window.opener = null;
    //          window.close();
    //      }
    //      else {
    //          window.opener = '';
    //          window.close();
    //      }

    //   }
    //  else {
    //      window.close();
    //   }
  }

}
