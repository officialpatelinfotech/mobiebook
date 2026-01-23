import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConfirmationType } from 'src/app/config/mastercode.const';
import { ConfimationService } from '../confimation.service';

@Component({
  selector: 'confirmation-popup',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {
  message: any;
  constructor(
      private confirmDialogService: ConfimationService
  ) { }

  ngOnInit(): any {
     /**
      *   This function waits for a message from alert service, it gets
      *   triggered when we call this from any other component
      */
      this.confirmDialogService.getMessage().subscribe(message => {
          this.message = message;
      });
  }

}
