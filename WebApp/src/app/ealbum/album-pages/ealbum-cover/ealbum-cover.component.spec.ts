import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EalbumCoverComponent } from './ealbum-cover.component';

describe('EalbumCoverComponent', () => {
  let component: EalbumCoverComponent;
  let fixture: ComponentFixture<EalbumCoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EalbumCoverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EalbumCoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
