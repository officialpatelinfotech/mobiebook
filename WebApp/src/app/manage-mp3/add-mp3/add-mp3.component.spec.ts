import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddMp3Component } from './add-mp3.component';


describe('AddMp3Component', () => {
  let component: AddMp3Component;
  let fixture: ComponentFixture<AddMp3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddMp3Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMp3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
