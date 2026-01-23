import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EalbumInfoComponent } from './ealbum-info.component';

describe('EalbumInfoComponent', () => {
  let component: EalbumInfoComponent;
  let fixture: ComponentFixture<EalbumInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EalbumInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EalbumInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
