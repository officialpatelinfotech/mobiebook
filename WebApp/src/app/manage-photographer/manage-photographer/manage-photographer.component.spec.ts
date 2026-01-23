import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePhotographerComponent } from './manage-photographer.component';

describe('ManagePhotographerComponent', () => {
  let component: ManagePhotographerComponent;
  let fixture: ComponentFixture<ManagePhotographerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManagePhotographerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagePhotographerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
