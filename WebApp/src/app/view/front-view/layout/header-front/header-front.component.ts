import { Component, OnInit } from '@angular/core';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';


@Component({
  selector: 'app-header-front',
  templateUrl: './header-front.component.html',
  styleUrls: ['./header-front.component.css']
})
export class HeaderFrontComponent implements OnInit {
  isLogin : boolean = false;
  constructor() {
   }

  ngOnInit(): void {
    let token = localStorage.getItem(GLOBAL_VARIABLE.TOKEN)
    if(token != undefined && token != null){
      this.isLogin = true;
    }

  }
 
 
}
