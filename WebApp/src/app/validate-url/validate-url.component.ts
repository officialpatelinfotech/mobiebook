import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-validate-url',
  templateUrl: './validate-url.component.html',
  styleUrls: ['./validate-url.component.css']
})
export class ValidateUrlComponent implements OnInit {
  uniqCode: any;
  msg = "Validating short url"

  constructor(
    private activeRouter: ActivatedRoute,
    private authService: AuthService    
  ) { 
    debugger;
    this.activeRouter.params.subscribe((param: any) => {
      if (param.id != undefined) {
        this.uniqCode = param.id;
        this.getUniqCode();
      }
    });
  }

  ngOnInit(): void {
  }

  getUniqCode(){
    debugger;
    this.authService.getEalbumUniq(this.uniqCode)
        .subscribe((data: any) => {
          let urlMain = "https://api.mobiebook.online/resources/"+data.UserId+"/"+data.EAlbumId+"/index.html?id="+data.UniqId;
         
          window.location.href = urlMain;
        },
        error => {
         this.msg = error.message;
        })
  }



}
