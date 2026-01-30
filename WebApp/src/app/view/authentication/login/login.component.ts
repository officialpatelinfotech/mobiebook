import { Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { MasterCodeEnum } from 'src/app/config/mastercode.const';
import { DropDownMetaData } from 'src/app/models/dropdown.metadata';
import { LoginMetaData } from 'src/app/models/login.metadata';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginDetail:LoginMetaData;
  masterDetail: DropDownMetaData[] = [];
  errorShowToast:boolean =false;
  showMessage :boolean =false;
  msgText : "";
  fieldTextType: boolean = false;
  uniqCode: any;
  isDisplay: boolean = true; 
  
  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private activeRouter: ActivatedRoute,
    private routingService: RoutingService,
    private localStoreService: LocalstoreService,
    private commonService: CommonService,
    private ngZone: NgZone,
    private userService: UserService
  ) {
   
    this.activeRouter.queryParams.subscribe(params => {
      this.uniqCode = params['q'];
      if(this.uniqCode != undefined){
        this.getUniqCode()
        this.isDisplay= false;
      }     
  });

    this.loginForm = this.createForm();

   }

  ngOnInit(): void {
    this.getMaster();
  }

  get f(){
    return this.loginForm.controls;
  }

  loginUser(){
    debugger;
    if(this.loginForm.valid){
      let formCtrl = this.loginForm.controls;
      this.loginDetail = new  LoginMetaData();
      this.loginDetail.UserName = formCtrl.user.value;
      this.loginDetail.UserPassword = formCtrl.password.value;
      this.loginDetail.RememberMe = true; // formCtrl.remember.value;  

      this.authService.loginUser(this.loginDetail)
          .subscribe((data: any) => {
            this.localStoreService.setItem(GLOBAL_VARIABLE.LOGIN_DETAIL,JSON.stringify(data));
            this.localStoreService.setItem(GLOBAL_VARIABLE.TOKEN,data.Token);
            this.getUserSetting();
          },
          error => {
            this.showMessage = true;
            this.msgText = error;
            setTimeout (() => {
              this.showMessage= false;
           }, 3000);
           this.errorShowToast =false;
          })
    }
  }

  errorAlert(){
    this.errorShowToast = false;
  }
  createForm(){
    return this.fb.group({
      user:[,[Validators.required]],
      password: [,[Validators.required]],
      remember:[]
    })
  }

  getMaster(): void {
    this.commonService.getMasterByCode(MasterCodeEnum.BusinessType)
      .subscribe((data: any) => {
        this.masterDetail = data;
      },
        error => {
          console.log(error);
        })
  }

  togglePassword(){
    this.fieldTextType = !this.fieldTextType;
  }

  getUniqCode(){
   
    this.authService.getEalbumUniq(this.uniqCode)
        .subscribe((data: any) => {
          let urlMain = `${GLOBAL_VARIABLE.SERVER_LINK}Resources/${data.UserId}/${data.EAlbumId}/index.html?id=${data.UniqId}`;
         
          window.location.href = urlMain;
        },
        error => {
         //this.msg = error.message;
        })
  }

  getUserSetting(){
    this.userService.getSettingDetails()
    .subscribe((data: any) => {
      this.localStoreService.setItem(GLOBAL_VARIABLE.Setting,JSON.stringify(data));   
      this.routingService.routing("/dashboard/dashboard-view");       
    },
    error => {

      this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
    })
  }



}
