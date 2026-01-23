import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationMetaData } from 'src/app/models/pagination.metadata';
import { CommonService } from 'src/app/services/common.service';
import { CouponService } from 'src/app/services/coupon.service';
import { RoutingService } from 'src/app/services/routing.service';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { ConfimationService } from 'src/app/shared/confimation.service';
import { NotificationService } from 'src/app/services/notification.service';
import { Mp3Service } from 'src/app/services/mp3.service';
import { FavourateMp3Metadata } from 'src/app/models/mp3details.metadata';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { element } from 'protractor';

@Component({
  selector: 'app-manage-mp3',
  templateUrl: './manage-mp3.component.html',
  styleUrls: ['./manage-mp3.component.css']
})
export class ManageMp3Component implements OnInit, OnDestroy {
  mp3List: any[] = [];
  mp3AllList: any[] = [];
  pagination: PaginationMetaData;
  dateFormat = GLOBAL_VARIABLE.DEFAULT_DATE_FORMAT;
  favourateMp3Metadata = new FavourateMp3Metadata();
  userDetails: any;
  totalRecord: any = 0;searchText: string = "";

  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/Mp3Files/"
    
  setPagination(page = 1): void {
    if (this.pagination === undefined) {
      this.pagination = new PaginationMetaData();
    }

    this.pagination.PageIndex = page;
    this.pagination.PageSize = 5;
    this.pagination.FilterString = '';
  }

  constructor(
    private routingService: RoutingService,
    private couponService: CouponService,
    private confirmDialogService: ConfimationService,
    private notificationService: NotificationService,
    private mp3Service : Mp3Service,
    private localStoreService: LocalstoreService,
  ) { 
    this.setPagination();
  }

  ngOnInit(): void {
    this.userDetails =   JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL))
    this.getmp3List();
  }

  addmp3(): void {
    this.routingService.routing('auth/manage-mp3/add-mp3');
  }

  getmp3List(): void {
    this.mp3Service.getAllMp3Files(this.userDetails.UserId)
        .subscribe((data: any) => {
          debugger;
          this.mp3List = data;
          this.mp3AllList = data;
          this.totalRecord = data.length;
        },
        error => {
          console.log(error);
        });
  }

  ngOnDestroy(): void{

  }

  editCoupon(mp3Id){
    this.routingService.routing(`auth/manage-mp3/edit-mp3/${mp3Id}`);
  }

  favourate(mp3Id){
    this.favourateMp3Metadata.IsActive = true;
    this.favourateMp3Metadata.Mp3Id = mp3Id;
    this.favourateMp3Metadata.UserId = this.userDetails.UserId;
      this.mp3Service.addFavourate(this.favourateMp3Metadata)
          .subscribe((data: any) => {
            this.notificationService.showError(GLOBAL_VARIABLE.UPDATE_MSG,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
            this.getmp3List();
          },
          error => {
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          })
  }

  deleteMp3(mp3Id){
    this.favourateMp3Metadata.IsActive = true;
    this.favourateMp3Metadata.Mp3Id = mp3Id;
    this.favourateMp3Metadata.UserId = this.userDetails.UserId;
      this.mp3Service.deleteMp3(this.favourateMp3Metadata)
          .subscribe((data: any) => {
            this.notificationService.showSuccess(GLOBAL_VARIABLE.DELETE_MSG,GLOBAL_VARIABLE.SUCCESS_MSG_TYPE)
            this.getmp3List();
          },
          error => {
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          })
  }

  defaultMp3(mp3Id){
    this.favourateMp3Metadata.IsActive = true;
    this.favourateMp3Metadata.Mp3Id = mp3Id;
    this.favourateMp3Metadata.UserId = this.userDetails.UserId;
      this.mp3Service.setDefaultMp3(this.favourateMp3Metadata)
          .subscribe((data: any) => {
            this.notificationService.showError(GLOBAL_VARIABLE.UPDATE_MSG,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
            this.getmp3List();
          },
          error => {
            this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
          })
  }

  favconfirmation(id): any {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.FAV_CONFIRM_MESSAGE, () =>  {
        this.favourate(id);
    }, () => {
    });
  }

  delconfirmation(id): any {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.DELETE_CONFIRM_MESSAGE, () =>  {
        this.deleteMp3(id);
    }, () => {
    });
  }

  defaultconfirmation(id): any {
    this.confirmDialogService.confirmThis(GLOBAL_VARIABLE.DEFAULT_CONFIRM_MESSAGE, () =>  {
        this.defaultMp3(id);
    }, () => {
    });
  }

  onChangePage(event){
    this.pagination.PageIndex =  event;

  }

  searchChange(event) { 
    
    this.pagination.PageIndex =  1;
    this.searchText = event;
    this.pagination.FilterString  = event;
    this.mp3List = this.mp3AllList.filter((obj) =>
    JSON.stringify(obj.Title).toLowerCase().includes(event.toLowerCase())
  )
    
  }

}
