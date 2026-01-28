import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GLOBAL_VARIABLE } from '../config/globalvariable';
import { LoginMetaData } from '../model/login.metadata';
import { AuthService } from '../services/auth.service';
import { LocalStorageService } from '../services/local-storage.service';
import { RoutingService } from '../services/routing.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginDetail: LoginMetaData | undefined;
  showMessage: boolean | undefined;
  msgText: string | undefined;
  errorShowToast: boolean | undefined;
  fieldTextType: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private localStoreService: LocalStorageService,
    private routingService: RoutingService,
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_CREDENTIAL) != null) {
      let credential = this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_CREDENTIAL);
      if (credential != null) {
        let ctrl = JSON.parse(credential) as LoginMetaData;
        this.loginForm.patchValue({
          user: ctrl.UserName,
          password: ctrl.UserPassword,
          remember: ctrl.RememberMe
        })
      }

    }
  }

  loginUser() {
    if (this.loginForm?.valid) {
      debugger;
      let formCtrl = this.loginForm.controls;
      this.loginDetail = new LoginMetaData();
      this.loginDetail.UserName = formCtrl.user.value;
      this.loginDetail.UserPassword = formCtrl.password.value;
      this.loginDetail.RememberMe = formCtrl.remember.value == null ? false : formCtrl.remember.value;

      this.authService.loginUser(this.loginDetail)
        .subscribe((data: any) => {
          if (data.IsWindowApp == true) {
            this.localStoreService.setItem(GLOBAL_VARIABLE.LOGIN_DETAIL, JSON.stringify(data));
            this.localStoreService.setItem(GLOBAL_VARIABLE.TOKEN, data.Token);
            if (this.loginDetail != undefined) {
              if (this.loginDetail.RememberMe) {
                this.localStoreService.setItem(GLOBAL_VARIABLE.LOGIN_CREDENTIAL, JSON.stringify(this.loginDetail));
              }
            }

            this.routingService.routing("/dashboard");
          }
          else {
            this.showMessage = true;
            this.msgText = "You are not authorize to access window app";
            setTimeout(() => {
              this.showMessage = false;
              this.msgText = "";
            }, 6000);
          }
        },
          error => {
            this.showMessage = true;

            // Network / CORS / timeout errors often arrive as a ProgressEvent or status 0
            if (error instanceof ProgressEvent || (error && (error.status === 0 || error.type === 'error'))) {
              this.msgText = 'Network error: cannot reach server. Please check your connection or server status.';
            } else if (error && error.error && typeof error.error === 'string') {
              this.msgText = error.error;
            } else if (error && error.error && error.error.message) {
              this.msgText = error.error.message;
            } else if (error && error.message) {
              this.msgText = error.message;
            } else {
              this.msgText = JSON.stringify(error);
            }

            setTimeout(() => {
              this.showMessage = false;
            }, 3000);
            this.errorShowToast = false;
          })
    }
  }

  get f() {
    return this.loginForm?.controls;
  }

  createForm() {
    return this.fb.group({
      user: [, [Validators.required]],
      password: [, [Validators.required]],
      remember: []
    })
  }


  errorAlert() {

  }


  togglePassword() {
    this.fieldTextType = !this.fieldTextType;
  }


}
