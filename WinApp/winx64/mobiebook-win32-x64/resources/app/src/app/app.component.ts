import { Component } from '@angular/core';
import { ImagesService } from './images.service';
// import { read, readdir, stat } from 'fs';
// import { resolve } from 'path';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // private currentPath: string = process.cwd();
  // private entries: Array<string> | undefined;
  title = 'Image Browser' ;

  constructor(private imageService: ImagesService) {
    this.imageService.navigateDirectory('.');
  }

  ngOnInit(): void {
    this.imageService.images.subscribe(x => {
      console.log(x);
    })

    this.imageService.directory.subscribe(y => {
      console.log(y);
    })
    //this.updateEntries();
  }

  // private updateEntries() {    
  //   readdir(this.currentPath, 
  //     (err: any, files: any) => {
  //     if (err) {
  //       console.error(err);
  //     }
  //     this.entries = ['../'].concat(files);
  //   });
  // }

  // private changeDir(newDir: string) {
  //   const targetPath = resolve(this.currentPath, newDir);
  //   stat(targetPath, (err, stats) => {
  //     if (err) {
  //       console.error(err);
  //     }
  //     if (stats.isFile()) {
  //       this.openFile(targetPath);
  //     } else if (stats.isDirectory()) {
  //       this.currentPath = targetPath;
  //       this.updateEntries();
  //     } else {
  //       console.error(new Error(`Unknown file system object: ${targetPath}`));
  //     }
  //   });
  // }

  // private openFile(path: string) {
  //   // TODO: Implement file opening
  //   return
  // }
}
