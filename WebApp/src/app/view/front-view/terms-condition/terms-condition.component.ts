import { Component, OnInit } from '@angular/core';
import { Swiper, Navigation, Pagination, Autoplay, EffectFlip, EffectFade } from 'swiper';
@Component({
  selector: 'app-terms-condition',
  templateUrl: './terms-condition.component.html',
  styleUrls: ['./terms-condition.component.css']
})
export class TermsConditionComponent implements OnInit {

  constructor() { 
   
  }

  ngOnInit(): void {
    this.sliderShow();
  }
  sliderShow(){
    Swiper.use([Navigation, Pagination, Autoplay, EffectFade]);
    const swiper = new Swiper('.swiper-container', {
      spaceBetween: 30,
      centeredSlides: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  }
}
