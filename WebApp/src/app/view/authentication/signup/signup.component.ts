import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { MasterCodeEnum } from 'src/app/config/mastercode.const';
import { MustMatch } from 'src/app/config/match.validator';
import { DropDownMetaData } from 'src/app/models/dropdown.metadata';
import { LoginMetaData } from 'src/app/models/login.metadata';
import { AddUserRegisterMetaData } from 'src/app/models/register.metadata';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  registerForm: FormGroup;
  addUser: AddUserRegisterMetaData;
  loadpageViews:boolean =true;
  loginDetail:LoginMetaData;
  labViews:boolean =false;
  masterDetail: DropDownMetaData[] = [];
  errorShowToast:boolean =false;
  showMessage :boolean =false;
  msgText : string = ""

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private activeRouter: ActivatedRoute,
    private routingService: RoutingService,
    private commonService: CommonService,
    private localStoreService: LocalstoreService,
  ) {
    this.registerForm = this.createForm();
    this.passwordType = "password";
  }

  ngOnInit(): void {
    this.getMaster();
  }
  labView(e){
    this.labViews =true;
    this.loadpageViews =false;
  }
  createForm() {
    return this.fb.group({
      type: [],
      name: [, [Validators.required]],
      email: [, [Validators.required, Validators.email]],
      password: [, [Validators.required,
        Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}')],
      ],
      // confirmpassword: [, [Validators.required,
      //   Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}')],
      // ],
     // referalcode:[],
      mobileno: [, [Validators.required]],
      isagree: []
     }
     //,
    //   {
    //     validator: MustMatch('password', 'confirmpassword')
    //   }
      );
  }

  get f(){
    return this.registerForm.controls;
  }

  getMaster(): void {
    this.commonService.getMasterByCode(MasterCodeEnum.BusinessType)
      .subscribe((data: any) => {
        this.masterDetail = data;
        this.registerForm.patchValue({
            type: this.masterDetail[0].Id
        })
      },
        error => {
          console.log(error);
        })
  }
  
  loginUser(username , password){
      this.loginDetail = new  LoginMetaData();
      this.loginDetail.UserName = username;
      this.loginDetail.UserPassword = password;
      this.loginDetail.RememberMe = true; // formCtrl.remember.value;
  
      this.authService.loginUser(this.loginDetail)
          .subscribe((data: any) => {
            this.localStoreService.setItem(GLOBAL_VARIABLE.LOGIN_DETAIL,JSON.stringify(data));
            this.localStoreService.setItem(GLOBAL_VARIABLE.TOKEN,data.Token);
            this.routingService.routing("/dashboard/dashboard-view");
          },
          error => {
            
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          })
    
  }


  registerUser() {
    debugger
    if (this.registerForm.valid) {
      
      let ctrl = this.registerForm.controls;
      if(ctrl.isagree.value != true)
      {
        this.showMessage = true;
        this.msgText = 'Please accept terms & conditions '

        setTimeout(() => {
          this.showMessage = false;
          this.msgText = ''
        },3000);
        return;
      }
        

      this.addUser = new AddUserRegisterMetaData();

      this.addUser.FullName = ctrl.name.value;
      if(ctrl.mobileno.value != null)
      {
        this.addUser.Phone = ctrl.mobileno.value.toString();
      } 

      this.addUser.UserName = ctrl.email.value;
      this.addUser.UserPassword = ctrl.password.value;
      this.addUser.BusinessTypeId = parseInt(ctrl.type.value);

      this.authService.registerUser(this.addUser)
        .subscribe((data: any) => {
          this.loginUser(this.addUser.UserName,this.addUser.UserPassword)
          this.notificationService.showSuccess(GLOBAL_VARIABLE.REGISTER_SUCCESS, GLOBAL_VARIABLE.SUCCESS_MSG_TYPE);
        //  this.routingService.routing('/authentication/login');
        },
          error => {
            this.showMessage = true;
            this.msgText = error;
            setTimeout (() => {
              this.showMessage = false;
           }, 5000);

            this.errorShowToast =false;
          })

    }
  }
  errorAlert(){
    this.errorShowToast = false;
  }

  passwordType: string;
  changetype(){
    if( this.passwordType === "password"){
      this.passwordType = "text"
    }
    else{
      this.passwordType = "password";
    }
    
    
  }
 
}
