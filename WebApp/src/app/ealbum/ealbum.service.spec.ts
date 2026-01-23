import { TestBed } from '@angular/core/testing';

import { EalbumService } from './ealbum.service';

describe('EalbumService', () => {
  let service: EalbumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EalbumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
