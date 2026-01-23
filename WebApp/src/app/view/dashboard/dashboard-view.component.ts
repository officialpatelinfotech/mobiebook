import { Component, OnInit } from '@angular/core';
import { BusinessType, GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { CommonService } from 'src/app/services/common.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.css']
})
export class DashboardViewComponent implements OnInit {
  userDetails: any;
  isAdmin : boolean = false;
  dashboard: any[]= [];

  constructor(
    private localStoreService: LocalstoreService,
    private commonService: CommonService,
    private routingService: RoutingService
  ) { }

  ngOnInit(): void {
    this.userDetails =   JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL))
    this.getDashboardDetail();
    
    if(this.userDetails.UserTypeId == BusinessType.Lab)
    {
      this.isAdmin = true;
    }
    
  }

  getDashboardDetail(){
    this.commonService.getDashboardDetail()
        .subscribe((x:any) => {
          let detail = x;
          if(this.isAdmin == true){
            this.dashboard = detail.filter(x => x.Code != 'UPLOADED');
          }else{
            this.dashboard = detail.filter(x => x.Code != 'CREATED');
          }
         
        },
        error => {
          console.log(error);
        })
  }

  viewDetail(detail){
   // alert(detail);
    this.routingService.routing('dashboard/dashboard-view-detail/' + detail.Code);
  }

}
