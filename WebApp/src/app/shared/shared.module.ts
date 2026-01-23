import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { AlertViewComponent } from './alert-view/alert-view.component';
import { DragdropDirective } from '../directive/dragdrop.directive';
import { ToolBarComponent } from './tool-bar/tool-bar.component';
import { RouterModule } from '@angular/router';
import { PaginationComponent } from './pagination/pagination.component';


@NgModule({
  declarations: [
    ConfirmationComponent,
    AlertViewComponent,
    DragdropDirective,
    ToolBarComponent,
    PaginationComponent
  ],
  exports:[
    ConfirmationComponent,
    DragdropDirective,
    ToolBarComponent,
    PaginationComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class SharedModule { }
