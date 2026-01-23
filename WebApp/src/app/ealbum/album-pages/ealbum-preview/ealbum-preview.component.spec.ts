import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EalbumPreviewComponent } from './ealbum-preview.component';

describe('EalbumPreviewComponent', () => {
  let component: EalbumPreviewComponent;
  let fixture: ComponentFixture<EalbumPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EalbumPreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EalbumPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
