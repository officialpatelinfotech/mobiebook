import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class RoutingService {

    constructor(private route: Router) { }

    // tslint:disable-next-line: typedef
    routing(url) {
        this.route.navigate(['/' + url]);
    }

      // tslint:disable-next-line: typedef
    routingQuery(url,qry) {
        this.route.navigate(['/' + url], { queryParams: qry});
    }
}
