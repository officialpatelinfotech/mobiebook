import { Injectable, NgModule } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Ng2ImgMaxService {
  resizeImage(file: File, _maxWidth: number, _maxHeight: number): Observable<File> {
    return of(file);
  }

  compressImage(file: File, _ratio: number): Observable<File> {
    return of(file);
  }
}

@NgModule({})
export class Ng2ImgMaxModule {}
