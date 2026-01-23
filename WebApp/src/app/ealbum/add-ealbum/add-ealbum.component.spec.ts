import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEalbumComponent } from './add-ealbum.component';

describe('AddEalbumComponent', () => {
  let component: AddEalbumComponent;
  let fixture: ComponentFixture<AddEalbumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEalbumComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEalbumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
