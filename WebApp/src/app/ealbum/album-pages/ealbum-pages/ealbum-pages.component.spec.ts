import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EalbumPagesComponent } from './ealbum-pages.component';

describe('EalbumPagesComponent', () => {
  let component: EalbumPagesComponent;
  let fixture: ComponentFixture<EalbumPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EalbumPagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EalbumPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
