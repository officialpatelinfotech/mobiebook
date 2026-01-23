import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LeftMenuComponent } from './left-menu/left-menu.component';



@NgModule({
  declarations: [HeaderComponent, FooterComponent, LeftMenuComponent],
  imports: [
    CommonModule
  ],
  exports: [HeaderComponent, FooterComponent, LeftMenuComponent]
})
export class LayoutModule { }
