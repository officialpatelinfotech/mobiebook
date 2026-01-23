import { TestBed } from '@angular/core/testing';

import { ConfimationService } from './confimation.service';

describe('ConfimationService', () => {
  let service: ConfimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
