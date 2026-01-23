import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EalbumSlidePagesComponent } from './ealbum-slide-pages.component';

describe('EalbumSlidePagesComponent', () => {
  let component: EalbumSlidePagesComponent;
  let fixture: ComponentFixture<EalbumSlidePagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EalbumSlidePagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EalbumSlidePagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
