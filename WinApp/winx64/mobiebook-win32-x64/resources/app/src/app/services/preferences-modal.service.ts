import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreferencesModalService {
  private readonly openPreferencesSubject = new Subject<void>();

  readonly openPreferences$ = this.openPreferencesSubject.asObservable();

  open() {
    this.openPreferencesSubject.next();
  }
}
