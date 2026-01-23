import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { EalbumService } from '../ealbum.service';


@Component({
  selector: 'app-display-img',
  templateUrl: './display-img.component.html',
  styleUrls: ['./display-img.component.css']
})
export class DisplayImgComponent implements OnInit {
  @Input() RowDisplay;
  @Input() viewtype;
  @Input() album;
  rowcls: string = "col-md-3"
  
  displayDetail: any[] =[];
  constructor(
    private albumService: EalbumService,
    
  ) {



   }

  ngOnInit(): void {
    if(this.viewtype == "PAGE"){
      this.rowcls = "col-md-3"
    }
    else {
      this.rowcls = "col-md-3"
    }
  
  }

  displayByte(bytes) {
    return this.albumService.byteFormat(bytes);
  }

  remove(f, i) {    
    
    if(f.AlbumPageId > 0){
      let val= {
        AlbumPageId:f.AlbumPageId,
        AlbumId:f.AlbumId
      }
   
      this.albumService.deleteAlbumPage(val)
          .subscribe((data: any) => {
            this.RowDisplay = this.RowDisplay.filter(x =>x.AlbumPageId != f.AlbumPageId);
          },
          error => {

          });
    }
    else{
      const index = this.RowDisplay.indexOf(i);
      this.RowDisplay.splice(i, 1);
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // transferArrayItem(event.previousContainer.data,
      //                   event.container.data,
      //                   event.previousIndex,
      //                   event.currentIndex);
    }
  }

  removeExtension(imgName){
    let im = imgName.split('.');
    if(im.length > 0){
      return im[0];
    }
  }
}
