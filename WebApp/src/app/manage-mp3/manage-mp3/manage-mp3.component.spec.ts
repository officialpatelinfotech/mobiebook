import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageMp3Component } from './manage-mp3.component';


describe('ManageMp3Component', () => {
  let component: ManageMp3Component;
  let fixture: ComponentFixture<ManageMp3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageMp3Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageMp3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
