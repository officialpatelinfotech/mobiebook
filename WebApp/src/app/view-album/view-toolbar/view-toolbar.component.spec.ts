import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewToolbarComponent } from './view-toolbar.component';

describe('ViewToolbarComponent', () => {
  let component: ViewToolbarComponent;
  let fixture: ComponentFixture<ViewToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
