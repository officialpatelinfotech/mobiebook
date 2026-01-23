import { Component, OnDestroy, OnInit } from '@angular/core';
import { BusinessType, GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { UserPaginationMetaData } from 'src/app/models/pagination.metadata';
import { CommonService } from 'src/app/services/common.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';
import { UserService } from 'src/app/services/user.service';
import { ConfimationService } from 'src/app/shared/confimation.service';

@Component({
  selector: 'app-manage-lab',
  templateUrl: './manage-lab.component.html',
  styleUrls: ['./manage-lab.component.css']
})
export class ManageLabComponent implements OnInit, OnDestroy {
  userList: any[] = [];
  pagination: UserPaginationMetaData;
  dateFormat = GLOBAL_VARIABLE.DEFAULT_DATE_FORMAT;
  totalRecord: any = 0;
  searchText: string = "";

  setPagination(page = 1): void {
    if (this.pagination === undefined) {
      this.pagination = new UserPaginationMetaData();
    }

    this.pagination.PageIndex = page;
    this.pagination.PageSize = 10;
    this.pagination.FilterString = '';
  }


  constructor( 
    private userService: UserService,
    private confirmDialogService: ConfimationService,
    private notificationService: NotificationService,
    
  ) {
    this.setPagination();
   }

  ngOnInit(): void {
    this.getUserList();
  }

  getUserList(): void {
    this.pagination.BusinessTypeId = BusinessType.Lab;
    this.userService.getUserList(this.pagination)
        .subscribe((data: any) => {
          
          this.userList = data.UserDetails;
          this.totalRecord = data.TotalRecord
        },
        error => {
          console.log(error);
        });
  }

  ngOnDestroy(): void{

  }

  windowUpdate = (user: any) => {
    let detail = {
      UserId: user.UserId,
      Status: user.IsWindowApp == true? false:true
    }

    this.userService.updateLabWindowApp(detail)
        .subscribe((data: any) => {
          if(detail.Status == true){
            this.notificationService.showSuccess(GLOBAL_VARIABLE.SUCCESS_MSG_TYPE, GLOBAL_VARIABLE.UPDATE_WINDOW_APP_ACTIVE)
          }
          else{
            this.notificationService.showSuccess(GLOBAL_VARIABLE.SUCCESS_MSG_TYPE, GLOBAL_VARIABLE.UPDATE_WINDOW_APP_DEACTIVE)
          }
          
          let selectedUser = this.userList.find(x => x.UserId == user.UserId);
          if(selectedUser != undefined){
            selectedUser.IsWindowApp = detail.Status;
          }
        },
        error => {
          console.log(error);
        })
  }

  blockUser = (user: any) => {
    let detail = {
      UserId: user.UserId,
      Status: user.IsActive == true? false:true
    }

    this.userService.updateLabStatus(detail)
        .subscribe((data: any) => {
          if(detail.Status == true){
            this.notificationService.showSuccess(GLOBAL_VARIABLE.SUCCESS_MSG_TYPE, GLOBAL_VARIABLE.UPDATE_WINDOW_APP_ACTIVE)
          }
          else{
            this.notificationService.showSuccess(GLOBAL_VARIABLE.SUCCESS_MSG_TYPE, GLOBAL_VARIABLE.UPDATE_WINDOW_APP_DEACTIVE)
          }
          
          let selectedUser = this.userList.find(x => x.UserId == user.UserId);
          if(selectedUser != undefined){
            selectedUser.IsActive = detail.Status;
          }
        },
        error => {
          console.log(error);
        })
  }
  
  confirmWindow(c) {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.SURE_MESSAGE, () => {
      this.windowUpdate(c);
    }, () => {
      //cancel event
    });
  }

  confirmBlock(c) {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.SURE_MESSAGE, () => {
      this.blockUser(c);
    }, () => {
      //cancel event
    });
  }

  onChangePage(event) {
    
    this.pagination.PageIndex =  event;
    this.getUserList();
  }

  searchChange(event) {
    
    this.pagination.PageIndex =  1;
    this.searchText = event;
    this.pagination.FilterString  = event;
    this.getUserList();
  }

}
