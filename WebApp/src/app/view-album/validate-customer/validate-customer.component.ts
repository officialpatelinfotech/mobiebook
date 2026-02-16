import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit, SecurityContext } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { RoutingService } from 'src/app/services/routing.service';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { AlbumService } from '../album.service';

@Component({
  selector: 'app-validate-customer',
  templateUrl: './validate-customer.component.html',
  styleUrls: ['./validate-customer.component.css']
})
export class ValidateCustomerComponent implements OnInit {
  deferredPrompt: any;
  showButton = false;

  customerForm: FormGroup;
  isview: boolean = true;
  showMessage: boolean = false;
  errorShowToast: boolean = false;
  albumId: number;
  msgText: string = '';
  showHelp: boolean = false;
  albumUserId: string = "";

  albumDetail: any = null;
  isAutoValidated: boolean = false;
  isLoadingPreview: boolean = false;
  coverImageUrl: string = '';

  constructor(
    private fb: FormBuilder,
    private activeRouter: ActivatedRoute,
    private albumService: AlbumService,
    private routingService: RoutingService,
    private localStoreService: LocalstoreService,
    private http: HttpClient,
    private domSanitizer: DomSanitizer

  ) {
    this.customerForm = this.createForm();

  }

  ngOnInit(): void {
    this.activeRouter.params.subscribe((param: any) => {
      if (param.id != undefined) {
        this.isview = true;
        this.albumId = +param.id;
        debugger;
        if (param.customerid != undefined) {
          this.customerForm.patchValue({
            code: param.customerid
          });

          this.localStoreService.setItem('oldurl', "/ealbum/validate/" + this.albumId + "/" + param.customerid)

          // Try a zero-friction validation first (many albums don't require email/mobile).
          // If it succeeds we show the welcome/preview screen; otherwise we fall back to the form.
          this.tryAutoValidate();
        }

        this.userDetail(this.albumId);
      }
      else {
        this.isview = false;
      }
    });
  }

  getCoverImageUrl(): string {
    return this.coverImageUrl || '';
  }

  getPhotographerName(): string {
    const name = (this.albumDetail?.FullName ?? this.albumDetail?.PhotographerName ?? this.albumDetail?.StudioName ?? '').toString().trim();
    return name;
  }

  private loadFrontCover(): void {
    if (!this.albumId) return;
    const uid = (this.albumUserId || this.albumDetail?.UserId)?.toString();
    if (!uid) return;

    this.albumService.getAlbumPageDetail(this.albumId)
      .subscribe((pages: any[]) => {
        const list = Array.isArray(pages) ? pages : [];
        const getViewType = (p: any) => (p?.PageViewType ?? '').toString().trim().toLowerCase();

        const front =
          list.find(p => getViewType(p) === 'front') ||
          list.find(p => getViewType(p) === 'tpfront') ||
          list.slice().sort((a, b) => ((a?.SequenceNo ?? 0) - (b?.SequenceNo ?? 0)))[0];

        const img = (front?.ImageLink ?? '').toString().trim();
        if (!img) return;
        this.coverImageUrl = `${GLOBAL_VARIABLE.SERVER_LINK}Resources/${uid}/${this.albumId}/${img}`;
      },
        _error => {
          // Optional preview only; ignore failures.
        });
  }

  viewMobiebook(): void {
    if (!this.albumId) return;
    this.routingService.routing("/ealbum/view/" + this.albumId);
  }

  shareApp(): void {
    const url = window.location.href;
    const title = this.albumDetail?.CoupleDetail ? `${this.albumDetail.CoupleDetail} Mobiebook` : 'Mobiebook';
    const text = 'View Mobiebook';

    const nav: any = navigator as any;
    if (nav && typeof nav.share === 'function') {
      nav.share({ title, text, url }).catch(() => { });
      return;
    }

    // Fallback: copy URL to clipboard.
    try {
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        nav.clipboard.writeText(url);
      }
    } catch { }
  }

  private tryAutoValidate(): void {
    const frm = this.customerForm.controls;
    const code = frm.code?.value;
    if (!this.albumId || !code) return;

    const req = {
      AlbumId: this.albumId,
      UniqCode: code,
      Email: '',
      Mobile: ''
    };

    this.isLoadingPreview = true;
    this.albumService.loginCustomer(req)
      .subscribe((data: any) => {
        this.isLoadingPreview = false;
        if (data != false) {
          this.localStoreService.setItem('albumdetail', JSON.stringify(data));
          this.albumDetail = data;
          this.isAutoValidated = true;

          // Ensure we have a userId for Resources/{userId}/{albumId}/... cover image.
          if (!this.albumUserId && data?.UserId != null) {
            this.albumUserId = data.UserId.toString();
          }
          this.loadFrontCover();
        }
      },
        _error => {
          this.isLoadingPreview = false;
        });
  }

  get f() {
    return this.customerForm.controls;
  }

  createForm() {
    return this.fb.group({
      code: [, [Validators.required]],
      email: [],
      mobile: []
    });
  }

  validate() {
    debugger;
    let frm = this.customerForm.controls;
    if (this.customerForm.valid) {
      let data = {
        AlbumId: this.albumId,
        UniqCode: frm.code.value,
        Email: frm.email.value,
        Mobile: frm.mobile.value
      }

      this.albumService.loginCustomer(data)
        .subscribe((data) => {
          if (data != false) {
            this.localStoreService.setItem('albumdetail', JSON.stringify(data));

            this.routingService.routing("/ealbum/view/" + this.albumId);
          }
        },
          error => {
            this.msgText = "Please use valide link and code";
            this.showMessage = true;
          })
    }
  }

  userDetail(elabumId) {
    this.albumService.userDetail(elabumId)
      .subscribe((data) => {
        this.albumUserId = data as any;
        this.updateManifest(this.albumId, this.albumUserId);

        // If we already validated and have album detail, we can now resolve cover.
        if (this.albumDetail != null && !this.coverImageUrl) {
          this.loadFrontCover();
        }
      },
        error => {
          this.msgText = "Please use valide link and code";
          this.showMessage = true;
        })
  }

  updateManifest(id, unicode) {
    debugger;
    // var full = window.location.host; // subdomain.domain.com
    // var parts = full.split('.');
    // var sub = parts[0];
    var link = document.createElement('link');
    link.href = `${GLOBAL_VARIABLE.SERVER_LINK}Resources/${unicode}/${id}/manifest.json?nocache=${(new Date()).getTime()}`;
    link.rel = 'manifest';
    document.getElementsByTagName('head')[0].appendChild(link);

    //document.querySelector('#mobiebook-placeholder').setAttribute('href', "https://api.mobiebook.online/Resources/2/399/manifest.json");     

    //   let url = "https://api.mobiebook.online/Resources/"+unicode+"/"+id+"/manifest.json?nocache=" + (new Date()).getTime();;
    //  this.fileExists(url);
    // this.fileExists(url, function(exists) {
    //   console.log('RESULT: url=' + url + ', exists=' + exists);
    //   if(exists){
    //     document.querySelector('#mobiebook-placeholder').setAttribute('href', "https://api.mobiebook.online/Resources/"+unicode+"/"+id+"/manifest.json");
    //   }
    //   else{
    //     document.querySelector('#mobiebook-placeholder').setAttribute('href', "manifest.webmanifest");
    //   }
    // });
  }

  showhelp() {

  }



  fileExists(url) {
    this.http.get(url)
      .subscribe((data: any) => {
        document.querySelector('#mobiebook-placeholder').setAttribute('href', url);
      },
        error => {
          document.querySelector('#mobiebook-placeholder').setAttribute('href', "manifest.webmanifest");
        })

  }


  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e: { preventDefault: () => void; }) {
    console.log(e);
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.deferredPrompt = e;
    this.showButton = true;
  }

  addToHomeScreen() {
    // hide our user interface that shows our A2HS button
    this.showButton = false;
    // Show the prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice
      .then((choiceResult: { outcome: string; }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        this.deferredPrompt = null;
      });
  }

}
