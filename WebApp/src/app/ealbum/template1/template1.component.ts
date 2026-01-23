import { Component, OnInit } from '@angular/core';
import { RoutingService } from 'src/app/services/routing.service';
import { Swiper, Navigation, Pagination, Autoplay, EffectFlip, EffectFade } from 'swiper';
@Component({
  selector: 'app-template1',
  templateUrl: './template1.component.html',
  styleUrls: ['./template1.component.css']
})
export class Template1Component implements OnInit {

  constructor( private routingService: RoutingService,) { }

  ngOnInit(): void {
    this.sliderShow();
  }
  closeTemplate(){
    this.routingService.routing("/auth/ealbum/addtemplate");
  }
  sliderShow() {
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
