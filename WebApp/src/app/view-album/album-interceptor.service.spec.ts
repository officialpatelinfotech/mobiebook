import { TestBed } from '@angular/core/testing';

import { AlbumInterceptorService } from './album-interceptor.service';

describe('AlbumInterceptorService', () => {
  let service: AlbumInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlbumInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
