import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapImageComponent } from './swap-image.component';

describe('SwapImageComponent', () => {
  let component: SwapImageComponent;
  let fixture: ComponentFixture<SwapImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwapImageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
