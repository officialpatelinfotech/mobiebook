import { Component, OnInit } from '@angular/core';
import { RoutingService } from 'src/app/services/routing.service';
import { Swiper, Navigation, Pagination, Autoplay, EffectFlip, EffectFade } from 'swiper';
@Component({
  selector: 'app-template2',
  templateUrl: './template2.component.html',
  styleUrls: ['./template2.component.css']
})
export class Template2Component implements OnInit {

  constructor(private routingService: RoutingService) { }

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
