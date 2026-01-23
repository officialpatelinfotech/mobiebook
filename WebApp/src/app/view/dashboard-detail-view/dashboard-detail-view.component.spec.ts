import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDetailViewComponent } from './dashboard-detail-view.component';

describe('DashboardDetailViewComponent', () => {
  let component: DashboardDetailViewComponent;
  let fixture: ComponentFixture<DashboardDetailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardDetailViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
