import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  constructor(private route: Router) { }

  // tslint:disable-next-line: typedef
  routing(url: string) {
      this.route.navigate(['/' + url]);
  }

    // tslint:disable-next-line: typedef
  routingQuery(url: string,qry: any) {
      this.route.navigate(['/' + url], { queryParams: qry});
  }
}
