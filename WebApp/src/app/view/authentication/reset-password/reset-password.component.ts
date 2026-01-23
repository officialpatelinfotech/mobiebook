import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { ForgotPasswordMetaData } from 'src/app/models/login.metadata';
import { AuthService } from 'src/app/services/auth.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  resetDetail:ForgotPasswordMetaData;
  showHelp:boolean = false;
  showMessage: boolean  = false;
  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private activeRouter: ActivatedRoute,
    private routingService: RoutingService,
    private localStoreService: LocalstoreService,
  ) {
    this.resetForm = this.createForm();
   }

  ngOnInit(): void {
  }

  createForm(){
    return this.fb.group({
      email:[,[Validators.required]],
    })
  }

  sendResetLink(){
    if(this.resetForm.valid){
      let formCtrl = this.resetForm.controls;
      this.resetDetail = new  ForgotPasswordMetaData();
      this.resetDetail.Email = formCtrl.email.value;

      this.authService.saveForgotPassword(this.resetDetail)
          .subscribe((data: any) => {
            this.notificationService.showSuccess("Email Send Successfully",GLOBAL_VARIABLE.SUCCESS);
            setTimeout(() => {
              this.routingService.routing('/');
            }, 2000);
          },
          error => {
            
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          })
    }
  }

  showhelp(){

  }

  get f(){
    return this.resetForm.controls;
  }


}
