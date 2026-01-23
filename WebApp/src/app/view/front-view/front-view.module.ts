import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { FaqComponent } from './faq/faq.component';

import { HomeComponent } from './home/home.component';
import { LayoutComponent } from './layout/layout.component';
import { HeaderFrontComponent } from './layout/header-front/header-front.component';
import { FooterFrontComponent } from './layout/footer-front/footer-front.component';
import { LayoutModule } from '../layout/layout.module';
import { RouterModule, Routes } from '@angular/router';
import { HowItWorkComponent } from './how-it-work/how-it-work.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsConditionComponent } from './terms-condition/terms-condition.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'aboutus',
        component: AboutUsComponent,
      },
      {
        path: 'contactus',
        component: ContactUsComponent,
      },
      {
        path: 'howitwork',
        component: HowItWorkComponent,
      },
      {
        path: 'privacypolicy',
        component: PrivacyPolicyComponent,
      },
      {
        path: 'termscondition',
        component: TermsConditionComponent,
      },
      {
        path: 'faq',
        component: FaqComponent,
      },
    ]
  },

];

@NgModule({
  declarations: [AboutUsComponent, ContactUsComponent, FaqComponent, HomeComponent, LayoutComponent, HeaderFrontComponent, FooterFrontComponent],
  imports: [
    CommonModule,
    LayoutModule,
    RouterModule.forChild(routes)
  ],
  exports: [FooterFrontComponent]
})
export class FrontViewModule { }
