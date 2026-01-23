import { Component, OnInit } from '@angular/core';
import { BusinessType, GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit {
  settingDetail: any;
  isEdit: boolean = false;
  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.getSetting();
  }

  getSetting = () => {
    this.userService.getSettingDetails()
          .subscribe((data: any) => {
            this.settingDetail = data;
          },
          error => {

            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
          })
  }

  userType(user:any){
    if(user.UserType == BusinessType.PhotoGrapher){
      return "Photographer"
    }
    if(user.UserType == BusinessType.Lab){
      return "Lab"
    }
  }

  editSetting() {
    this.isEdit  = true;
  }
  
  cancelSetting() {
    this.isEdit = false;
  }

  saveSetting() { 
    let change = this.settingDetail;
    let i = 0;
    change.forEach(element => {
        
        let row = {
          SettingId: element.SettingId,
          Status: element.IsAlbumUpload,
          SettingType: "ALBUM"
        }

        this.userService.updateSetting(row)
        .subscribe((data: any) => {
          i++;
          if(i == change.length){
            this.isEdit = false;
            this.notificationService.showSuccess("Setting saved successfully",GLOBAL_VARIABLE.SUCCESS_MSG_TYPE)
          }
        },
        error => {

          this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
        })
    });
  }

  onChanged($event,row){
    debugger;
    let status = $event.target.checked;
    let chgSetting = this.settingDetail.find(x => x.SettingId == row.SettingId);
    if(chgSetting != undefined){
      chgSetting.IsAlbumUpload = status;
    }
  }
}
