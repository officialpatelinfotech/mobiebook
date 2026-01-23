import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EalbumPublishComponent } from './ealbum-publish.component';

describe('EalbumPublishComponent', () => {
  let component: EalbumPublishComponent;
  let fixture: ComponentFixture<EalbumPublishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EalbumPublishComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EalbumPublishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
