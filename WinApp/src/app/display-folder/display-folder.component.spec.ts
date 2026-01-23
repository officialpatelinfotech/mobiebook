import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayFolderComponent } from './display-folder.component';

describe('DisplayFolderComponent', () => {
  let component: DisplayFolderComponent;
  let fixture: ComponentFixture<DisplayFolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayFolderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
