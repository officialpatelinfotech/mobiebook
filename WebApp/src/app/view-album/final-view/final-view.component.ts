import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClipboardService } from 'ngx-clipboard';
import { LocalstoreService } from 'src/app/services/localstore.service';

@Component({
  selector: 'app-final-view',
  templateUrl: './final-view.component.html',
  styleUrls: ['./final-view.component.css']
})
export class FinalViewComponent implements OnInit {
  url:any;
  uniqId: any;
  constructor(
    private localStoreService: LocalstoreService,
    @Inject(DOCUMENT) private readonly document: any,
    private clipboardService: ClipboardService,
    private route: ActivatedRoute
  ) { 
    this.route.queryParams.subscribe(params => {
      this.uniqId = params["q"];
   });
    
  }

  ngOnInit(): void {
    this.url = this.localStoreService.getItem('oldurl')
  }

  shareOnWhatsapp(){
    let url =this.document.location.origin;
    this.clipboardService.copyFromContent(url+"/#"+this.url);

    setTimeout(() => {
      window.open("https://web.whatsapp.com/://send?text=https://mobiebook.online/#/?q="+this.uniqId, "_blank");
    }, 100);
    
  }
}
