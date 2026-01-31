import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClipboardService } from 'ngx-clipboard';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-final-view',
  templateUrl: './final-view.component.html',
  styleUrls: ['./final-view.component.css']
})
export class FinalViewComponent implements OnInit {
  url: any;
  uniqId: string = '';
  albumId: number = 0;
  albumDetail: any = null;
  constructor(
    private localStoreService: LocalstoreService,
    @Inject(DOCUMENT) private readonly document: any,
    private clipboardService: ClipboardService,
    private route: ActivatedRoute,
    private routingService: RoutingService
  ) { 
    this.route.queryParams.subscribe(params => {
      const q = (params["q"] ?? params["id"] ?? '').toString();
      if (q) this.uniqId = q;
   });
    
  }

  ngOnInit(): void {
    this.url = this.localStoreService.getItem('oldurl')

    // Prefer album detail from localStorage (set during customer validation).
    // This page is shown after the viewer closes.
    try {
      const raw = this.localStoreService.getItem('albumdetail');
      if (raw) {
        this.albumDetail = JSON.parse(raw);
        const storedAlbumId = this.albumDetail?.EAlbumId ?? this.albumDetail?.AlbumId;
        if (storedAlbumId != null) {
          const parsed = Number(storedAlbumId);
          this.albumId = Number.isFinite(parsed) ? parsed : 0;
        }
        if (!this.uniqId && this.albumDetail?.UniqId) {
          this.uniqId = this.albumDetail.UniqId.toString();
        }
      }
    } catch {
      this.albumDetail = null;
    }

    // Fallback: try to extract albumId from oldurl like /ealbum/validate/{albumId}/...
    if (!this.albumId && typeof this.url === 'string') {
      const match = this.url.match(/\/ealbum\/validate\/(\d+)\//i);
      if (match && match[1]) {
        const parsed = Number(match[1]);
        this.albumId = Number.isFinite(parsed) ? parsed : 0;
      }
    }
  }


  getPhotographerName(): string {
    const name = (this.albumDetail?.FullName ?? this.albumDetail?.PhotographerName ?? this.albumDetail?.StudioName ?? '').toString().trim();
    return name;
  }

  getDisplayCode(): string {
    return (this.uniqId || this.albumDetail?.UniqId || '').toString();
  }

  viewMobiebook(): void {
    if (!this.albumId) return;
    this.routingService.routing("/ealbum/view/" + this.albumId);
  }

  private getShareUrl(): string {
    const origin = this.document?.location?.origin || window.location.origin;
    const code = this.getDisplayCode();
    if (code) {
      return `${origin}/#/?q=${encodeURIComponent(code)}`;
    }
    if (this.url) {
      return `${origin}/#${this.url}`;
    }
    return origin;
  }

  share(): void {
    const url = this.getShareUrl();
    const title = 'Mobiebook';
    const text = 'View Mobiebook';
    const nav: any = navigator as any;

    if (nav && typeof nav.share === 'function') {
      nav.share({ title, text, url }).catch(() => { });
      return;
    }

    // Fallback: copy URL.
    try {
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        nav.clipboard.writeText(url);
        return;
      }
    } catch { }

    this.clipboardService.copyFromContent(url);
  }
}
