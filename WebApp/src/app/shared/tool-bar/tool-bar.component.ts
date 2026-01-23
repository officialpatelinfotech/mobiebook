import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css']
})
export class ToolBarComponent implements OnInit {
  showHelp:boolean =false;
  constructor() { }

  ngOnInit(): void {
  }

  showhelp() {
    this.showHelp = !this.showHelp
  }


}
