import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ImagesService  } from '../images.service'


@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.css']
})
export class BrowserComponent implements OnInit {
  images: string[] = [];
  directory: string[] = [];

  constructor(
    private imageService: ImagesService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.imageService.images.subscribe((value) => {
      console.log(value);
      this.images = value;
      this.cdr.detectChanges();
    });

    this.imageService.directory.subscribe((value) => {
      console.log(value);
      this.directory = value;
      this.cdr.detectChanges();
    });
  }

  navigateDirectory(path:any) {   
    console.log(path);
    this.imageService.navigateDirectory(path);
  }

  browse(){
    this.navigateDirectory("/");
  }

}
