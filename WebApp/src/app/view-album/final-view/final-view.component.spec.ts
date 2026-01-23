import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalViewComponent } from './final-view.component';

describe('FinalViewComponent', () => {
  let component: FinalViewComponent;
  let fixture: ComponentFixture<FinalViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinalViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinalViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
