import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { LoginMetaData } from 'src/app/models/login.metadata';
import { AuthService } from 'src/app/services/auth.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent implements OnInit {

  loginForm: FormGroup;
  loginDetail:LoginMetaData;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private activeRouter: ActivatedRoute,
    private routingService: RoutingService,
    private localStoreService: LocalstoreService
  ) {

    this.loginForm = this.createForm();

   }

  ngOnInit(): void {
  }

  loginUser(){
    if(this.loginForm.valid){
      let formCtrl = this.loginForm.controls;
      this.loginDetail = new  LoginMetaData();
      this.loginDetail.UserName = formCtrl.user.value;
      this.loginDetail.UserPassword = formCtrl.password.value;
      this.loginDetail.RememberMe = true; // formCtrl.remember.value;

      this.authService.adminLoginUser(this.loginDetail)
          .subscribe((data: any) => {
            this.localStoreService.setItem(GLOBAL_VARIABLE.LOGIN_DETAIL,JSON.stringify(data));
            this.localStoreService.setItem(GLOBAL_VARIABLE.TOKEN,data.Token);
            this.routingService.routing("/dashboard/dashboard-view");
          },
          error => {
            
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          })
    }
  }

  createForm(){
    return this.fb.group({
      user:[,[Validators.required]],
      password: [,[Validators.required]],
      remember:[]
    })
  }

}
