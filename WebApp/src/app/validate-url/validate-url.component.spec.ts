import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidateUrlComponent } from './validate-url.component';

describe('ValidateUrlComponent', () => {
  let component: ValidateUrlComponent;
  let fixture: ComponentFixture<ValidateUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidateUrlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidateUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
