import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEalbumComponent } from './manage-ealbum.component';

describe('ManageEalbumComponent', () => {
  let component: ManageEalbumComponent;
  let fixture: ComponentFixture<ManageEalbumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageEalbumComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageEalbumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
