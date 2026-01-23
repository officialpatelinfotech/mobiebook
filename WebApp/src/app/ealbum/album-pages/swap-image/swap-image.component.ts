import { moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { ConfimationService } from 'src/app/shared/confimation.service';
import { EalbumService } from '../../ealbum.service';

@Component({
  selector: 'app-swap-image',
  templateUrl: './swap-image.component.html',
  styleUrls: ['./swap-image.component.css']
})
export class SwapImageComponent implements OnInit {
  imageDetail: any[] =[];

  constructor(
    private confirmDialogService: EalbumService
  ) { }

  ngOnInit(): void {
    this.confirmDialogService.getMessage().subscribe(message => {
      debugger;
      this.imageDetail = message.data;
  });
  }

  drop(event){
    if (event.previousContainer === event.container) {
      let i =0;
      this.imageDetail.forEach(x => {
        if(i >= event.currentIndex){
           x.SequenceNo = i+ 1
        }
        i++;
      });
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
     
    } else {

    }
  }

}
