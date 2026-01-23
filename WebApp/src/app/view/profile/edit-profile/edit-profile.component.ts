import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { CountryMetaData } from 'src/app/models/country.metadata';
import { DropDownMetaData } from 'src/app/models/dropdown.metadata';
import { ProfileMetaData } from 'src/app/models/profile.metadata';
import { CommonService } from 'src/app/services/common.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ProfileService } from 'src/app/services/profile.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  editProfileForm: FormGroup;
  profileMetaDate: ProfileMetaData;
  masterDetail: DropDownMetaData[] = [];
  countryDetail: CountryMetaData[] = [];
  userDetails: any;
  profileData:any;
  constructor(
    private routingService: RoutingService,
    private fb: FormBuilder,
    private commonService: CommonService,
    private profileService: ProfileService,
    private activeRouter: ActivatedRoute,
    private localStoreService: LocalstoreService,
    private notificationService: NotificationService,
  ) {
    this.editProfileForm = this.createForm();
    this.profileMetaDate = new ProfileMetaData();
  }

  ngOnInit(): void {
  this.userDetails =   JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL))
  this.getProfileDetails();
  }

  createForm(): any {
    return this.fb.group({
      fullname: [, [Validators.required]],
      businessname: [],
      phone: [],
      pincode: [],
      country: [],
      county: [],
      city: [],
      address1: [],
      address2: [],
    });
  }

  uploadFile(event): void {
    if (event === null && event === undefined) {
      console.error('No file selected');
    } else {

      const reader = new FileReader();
      this.commonService.imageToBase64(reader, event[0])
        .subscribe((data) => {
          this.profileMetaDate.Logo = data;
        });

    }
  }

  getProfileDetails(){
    this.profileService.getProfileDetailById(this.userDetails.UserId)
        .subscribe((data: any) => {         
            debugger;
            this.profileData = data;
            this.editProfileForm.patchValue({
              fullname: data.FullName,
              businessname: data.BusinessName,
              phone: data.Phone,
              pincode: data.PinCode,
              country: data.Country,
              county: data.County,
              city: data.City,
              address1: data.Address1,
              address2: data.Address2,
            });
        },
        error => {
          console.log(error);
        })
  }

  back(): void {
    this.routingService.routing('auth/manage-coupon');
  }

  saveProfileDetails(){

    let formCtrl = this.editProfileForm.controls;
    if (this.editProfileForm.valid) {

      this.profileMetaDate.UserId = this.userDetails.UserId;
      this.profileMetaDate.Address1 = formCtrl.address1.value;
      this.profileMetaDate.Address2 = formCtrl.address2.value;
      this.profileMetaDate.Country = formCtrl.country.value;
      this.profileMetaDate.County = formCtrl.county.value;
      this.profileMetaDate.City = formCtrl.city.value;
      if(formCtrl.phone != null)
      {
      this.profileMetaDate.Phone = formCtrl.phone.value.toString();
        
      }
      else
      {
      this.profileMetaDate.Phone = "";

      }
      this.profileMetaDate.PinCode = formCtrl.pincode.value;
      this.profileMetaDate.BusinessName =  formCtrl.businessname.value;
      this.profileMetaDate.FullName = formCtrl.fullname.value;
      this.profileService.updateProfile(this.profileMetaDate)
        .subscribe((data: any) => {
            this.notificationService.showSuccess(GLOBAL_VARIABLE.PROFILE_ADDEDD,GLOBAL_VARIABLE.SUCCESS_MSG_TYPE)
            this.back();
          },
          error => {           
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
          });
    }

  }
}
