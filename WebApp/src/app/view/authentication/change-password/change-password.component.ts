import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { MustMatch } from 'src/app/config/match.validator';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  changePassword: FormGroup;
  uniqCode: string;
  isShowMessage: boolean;
  msg: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private routingService: RoutingService,
  ) {
    
    this.changePassword = this.createForm();
    this.route.queryParamMap.subscribe(params => {
      this.uniqCode = params.get('code');
    });
  }

  get f() {
    return this.changePassword.controls;
  }

  ngOnInit(): void {
  }

  createForm() {
    return this.fb.group({
      password: [, [Validators.required]],
      confirmpassword: [, [Validators.required]]
    },
      {
        validator: MustMatch('password', 'confirmpassword')
      })

  }

  resetPassword() {
    
    if (this.changePassword.valid) {
      let pwdRow = this.changePassword.controls;

      let passwordDetail = {
        Password: pwdRow.password.value,
        UniqId: this.uniqCode
      };

      this.authService.resetForgotPassword(passwordDetail)
        .subscribe((data: any) => {
          this.notificationService.showSuccess("Password changed successfully", GLOBAL_VARIABLE.SUCCESS);
          setTimeout(() => {
            this.routingService.routing('/');
          }, 2000);
        },
          error => {
            
            this.notificationService.showError(error, GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          });
    }
  }

}


