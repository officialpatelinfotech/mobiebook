import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ImagesService } from '../images.service';
import { FileTree } from '../model/filetree.metadata';
import { AudioMetaData, FolderDetailMetaData } from '../model/folderdetail.metadata';
import { from, Observable, BehaviorSubject, Subject, defer, fromEvent, interval, merge, of, throwError } from 'rxjs';
import { catchError, concatMap, distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { AddAlbumMetaData } from '../model/addalbum.metadata';
import { EalbumService } from '../services/ealbum.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { IMG_TYPE } from '../config/globalvariable';
import { ExcelExportService } from '../excel-export.service';
import { LocalStorageService } from '../services/local-storage.service';
import { PreferencesModalService } from '../services/preferences-modal.service';
import { GLOBAL_VARIABLE } from '../config/globalvariable';

const Compress = require('client-compress')



declare var $: any;

const electron = (<any>window).require('electron');
var remote = electron.remote;
var electronFs = remote.require('fs');
var electronPath = remote.require('path');
var dialog = remote.dialog;
var util = remote.require('util');

declare var alphaNumericSort: Function;

@Component({
  selector: 'app-display-folder',
  templateUrl: './display-folder.component.html',
  styleUrls: ['./display-folder.component.css']
})
export class DisplayFolderComponent implements OnInit, OnDestroy {
  images: string[] = [];
  directory: any[] = [];
  currentWatcher: any;

  // QR background modal state
  qrBgModalOpen: boolean = false;
  qrBackgroundImageFile: File | null = null;
  qrBackgroundImagePreviewUrl: string | null = null;
  qrBackgroundImagePath: string | null = null;

  qrBgTempFile: File | null = null;
  qrBgTempPreviewUrl: string | null = null;
  qrBgTempPath: string | null = null;

  // UI helper: display selected image name in modal (avoid native "No file chosen")
  qrBgSelectedImageName: string | null = null;

  // Preferences: generate barcode under QR (per account)
  qrGenerateBarcode: boolean = false;
  qrGenerateBarcodeTemp: boolean = false;

  // Preferences: print folder name below barcode (per account)
  qrPrintFolderNameBelowBarcode: boolean = false;
  qrPrintFolderNameBelowBarcodeTemp: boolean = false;

  private readonly enableUploadDebugLog = true;
  private readonly coverAlertShownForFolder = new Set<string>();

  // ADD: spread limit constant (used only for validation)
  private readonly MAX_SPREADS = 72;

  // Internet-awareness
  private readonly destroy$ = new Subject<void>();
  private readonly online$ = new BehaviorSubject<boolean>(this.isOnlineNow());
  private currentProcessingFolder: FolderDetailMetaData | null = null;

  private isOnlineNow(): boolean {
    try {
      const nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined;
      const onLine = (nav as any)?.onLine;
      return typeof onLine === 'boolean' ? onLine : true;
    } catch {
      return true;
    }
  }

  selectedDirectory: any;
  isDirectiveLoad: boolean = false;
  folderDetail: FolderDetailMetaData[] = [];
  allfolderDetail: FolderDetailMetaData[] = [];
  elabumId: any = 0;
  isAllProcess: boolean = false;
  albums: any[] = [];
  selectedAudioId: any = 0;
  isCancel: boolean = false;
  statusList: any[] = [];
  selected: any;
  excelDetailData: any[] = [];

  excelUrl: any;
  @ViewChild('mp3File')
  mp3File!: ElementRef;

  @ViewChild('qrBgFileInput')
  qrBgFileInput!: ElementRef;

  constructor(
    private _electronService: ElectronService,
    private imageService: ImagesService,
    private cdr: ChangeDetectorRef,
    private ealbumService: EalbumService,
    private excelExport: ExcelExportService,
    private localStoreService: LocalStorageService,
    private preferencesModalService: PreferencesModalService,
    private ngZone: NgZone
  ) {

    this.statusList.push({ Id: 'ALL', Text: 'All' });
    this.statusList.push({ Id: 'Open', Text: 'Open' });
    this.statusList.push({ Id: 'In Progress', Text: 'In Progress' });
    this.statusList.push({ Id: 'Invalid', Text: 'Failed' });
    this.statusList.push({ Id: 'Done', Text: 'Success' });
  }

  ngOnInit(): void {
    this.setupInternetAwareness();
    this.getAudioDetail();
    this.loadSavedQrBgForCurrentUser();
    this.loadSavedQrBarcodePreference();
    this.loadSavedQrFolderNameBelowBarcodePreference();

    // Allow opening Preferences modal from the top header.
    this.preferencesModalService.openPreferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.openQrBgModal());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.currentWatcher) {
      this.currentWatcher.close();
    }
  }

  openQrBgModal() {
    this.qrBgTempFile = this.qrBackgroundImageFile;
    this.qrBgTempPreviewUrl = this.qrBackgroundImagePreviewUrl;
    this.qrBgTempPath = this.qrBackgroundImagePath;
    this.qrBgSelectedImageName = this.deriveQrBgSelectedImageName();
    this.qrGenerateBarcodeTemp = this.qrGenerateBarcode;
    this.qrPrintFolderNameBelowBarcodeTemp = this.qrPrintFolderNameBelowBarcode;
    this.qrBgModalOpen = true;
  }

  cancelQrBgModal() {
    // Do not change saved values
    this.qrBgTempFile = null;
    this.qrBgTempPreviewUrl = null;
    this.qrBgTempPath = null;
    this.qrBgSelectedImageName = this.deriveQrBgSelectedImageName();
    this.qrGenerateBarcodeTemp = this.qrGenerateBarcode;
    this.qrPrintFolderNameBelowBarcodeTemp = this.qrPrintFolderNameBelowBarcode;
    this.qrBgModalOpen = false;
  }

  private deriveQrBgSelectedImageName(): string | null {
    try {
      const f: any = this.qrBgTempFile || this.qrBackgroundImageFile;
      const nameFromFile = typeof f?.name === 'string' ? String(f.name).trim() : '';
      if (nameFromFile) return nameFromFile;

      const p = String(this.qrBgTempPath || this.qrBackgroundImagePath || '').trim();
      if (p) {
        const last = p.replace(/\\/g, '/').split('/').pop();
        return last ? String(last) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  replaceQrBgImage() {
    this.triggerQrBgEdit();
  }

  removeSelectedQrBgImage() {
    // Clear current selection in modal; saved value remains until Save is clicked.
    this.qrBgTempFile = null;
    this.qrBgTempPreviewUrl = null;
    this.qrBgTempPath = null;
    this.qrBgSelectedImageName = null;

    try {
      const input: any = this.qrBgFileInput?.nativeElement;
      if (input) {
        input.value = '';
      }
    } catch {
      // ignore
    }

    this.cdr.detectChanges();
  }

  triggerQrBgEdit() {
    try {
      const input: any = this.qrBgFileInput?.nativeElement;
      if (input && typeof input.click === 'function') {
        input.click();
      }
    } catch {
      // ignore
    }
  }

  saveQrBgImage() {
    let savedOk = false;
    try {
      // Persist selected image into app-owned storage so it remains available across restarts.
      // Image is optional: allow saving barcode preferences even if no image is selected.
      const hasAnyImageInput = !!(this.qrBgTempPath || this.qrBgTempPreviewUrl);
      let imageSavedOk = !hasAnyImageInput;
      if (hasAnyImageInput) {
        const saved = this.persistQrBgToUserData(this.qrBgTempPath, this.qrBgTempPreviewUrl);
        if (saved?.path) {
          this.qrBackgroundImagePath = saved.path;
          this.qrBackgroundImagePreviewUrl = saved.previewDataUrl ?? this.qrBgTempPreviewUrl;
          this.qrBackgroundImageFile = this.qrBgTempFile;
          this.localStoreService.setItem(this.getQrBgStorageKey(), saved.path);
          imageSavedOk = true;
        } else {
          // Fallback: if we at least have a DataURL (FileReader), persist that in localStorage.
          const dataUrl = String(this.qrBgTempPreviewUrl ?? '').trim();
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            this.qrBackgroundImagePath = null;
            this.qrBackgroundImagePreviewUrl = dataUrl;
            // Avoid keeping a stale path around.
            try { this.localStoreService.removeByKey(this.getQrBgStorageKey()); } catch { /* ignore */ }
            imageSavedOk = true;
          }
        }

        // Best-effort: also save the DataURL in localStorage (can fail due to quota limits).
        try {
          const dataUrlToPersist = String(this.qrBackgroundImagePreviewUrl ?? this.qrBgTempPreviewUrl ?? '').trim();
          if (dataUrlToPersist && dataUrlToPersist.startsWith('data:image/')) {
            this.localStoreService.setItem(this.getQrBgDataUrlStorageKey(), dataUrlToPersist);
          }
        } catch {
          // ignore
        }

        if (!imageSavedOk) {
          throw new Error('Failed to save QR background image');
        }
      }

      // persist barcode preference
      this.qrGenerateBarcode = !!this.qrGenerateBarcodeTemp;
      this.localStoreService.setItem(this.getQrBarcodePrefKey(), this.qrGenerateBarcode ? '1' : '0');

      // persist folder-name-below-barcode preference
      this.qrPrintFolderNameBelowBarcode = !!this.qrPrintFolderNameBelowBarcodeTemp;
      this.localStoreService.setItem(this.getQrFolderNameBelowBarcodePrefKey(), this.qrPrintFolderNameBelowBarcode ? '1' : '0');

      alert('All Preferences saved successfully');
      savedOk = true;
    } catch (e) {
      console.error('Failed to save QR background image', e);
      alert('Failed to save image');
    } finally {
      // Only close modal on successful save; keep it open on failure so user can retry.
      if (savedOk) {
        this.qrBgModalOpen = false;
      }
    }
  }

  onQrBgFileSelected(event: any) {
    try {
      const file: File | undefined = event?.target?.files?.[0];
      if (!file) return;

      // Enforce PNG-only background image selection.
      const anyFile: any = file as any;
      const nameForExt = String(anyFile?.path || file?.name || '').trim();
      const ext = this.getExtention(nameForExt).toLowerCase();
      if (ext && ext !== '.png') {
        alert('Please select PNG image only.');
        this.qrBgTempFile = null;
        this.qrBgTempPreviewUrl = null;
        this.qrBgTempPath = null;
        this.qrBgSelectedImageName = null;
        try {
          const input: any = this.qrBgFileInput?.nativeElement;
          if (input) input.value = '';
        } catch {
          // ignore
        }
        this.cdr.detectChanges();
        return;
      }

      this.qrBgTempFile = file;
      this.qrBgSelectedImageName = String(file?.name || '').trim() || this.qrBgSelectedImageName;

      // In Electron, File often has a non-standard `path` property. Prefer this for IPC (more reliable than huge DataURLs).
      const filePath = typeof anyFile?.path === 'string' ? String(anyFile.path) : null;
      this.qrBgTempPath = filePath;

      const reader = new FileReader();
      reader.onload = () => {
        this.qrBgTempPreviewUrl = String(reader.result || '');
        this.qrBgSelectedImageName = this.qrBgSelectedImageName || this.deriveQrBgSelectedImageName();
        this.cdr.detectChanges();
      };
      reader.onerror = () => {
        this.qrBgTempPreviewUrl = null;
      };
      reader.readAsDataURL(file);
    } catch {
      // keep silent to avoid breaking flow
    }
  }

  private getCurrentUserIdText(): string {
    try {
      const raw = this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL) ?? localStorage.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL);
      if (!raw) return 'anonymous';
      const parsed = JSON.parse(raw);
      const userId = parsed?.UserId ?? parsed?.userId ?? parsed?.userid;
      const asText = String(userId ?? '').trim();
      return asText || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  private getQrBgStorageKey(): string {
    return `QR_BG_IMAGE_PATH_${this.getCurrentUserIdText()}`;
  }

  private getQrBgDataUrlStorageKey(): string {
    return `QR_BG_IMAGE_DATAURL_${this.getCurrentUserIdText()}`;
  }

  private getQrBarcodePrefKey(): string {
    return `QR_GENERATE_BARCODE_${this.getCurrentUserIdText()}`;
  }

  private getQrFolderNameBelowBarcodePrefKey(): string {
    return `QR_PRINT_FOLDER_NAME_BELOW_BARCODE_${this.getCurrentUserIdText()}`;
  }

  private loadSavedQrBarcodePreference() {
    try {
      const raw = this.localStoreService.getItem(this.getQrBarcodePrefKey());
      const text = String(raw ?? '').trim().toLowerCase();
      this.qrGenerateBarcode = text === '1' || text === 'true' || text === 'yes';
      this.qrGenerateBarcodeTemp = this.qrGenerateBarcode;
    } catch {
      this.qrGenerateBarcode = false;
      this.qrGenerateBarcodeTemp = false;
    }
  }

  private loadSavedQrFolderNameBelowBarcodePreference() {
    try {
      const raw = this.localStoreService.getItem(this.getQrFolderNameBelowBarcodePrefKey());
      const text = String(raw ?? '').trim().toLowerCase();
      this.qrPrintFolderNameBelowBarcode = text === '1' || text === 'true' || text === 'yes';
      this.qrPrintFolderNameBelowBarcodeTemp = this.qrPrintFolderNameBelowBarcode;
    } catch {
      this.qrPrintFolderNameBelowBarcode = false;
      this.qrPrintFolderNameBelowBarcodeTemp = false;
    }
  }

  private getQrBgUserDataDirForUser(userId: string): string {
    const userDataDir = remote?.app?.getPath ? remote.app.getPath('userData') : null;
    if (!userDataDir) throw new Error('Electron userData path unavailable');
    return electronPath.join(userDataDir, 'qr-background', userId);
  }

  private findSavedQrBgInUserData(userId: string): string | null {
    try {
      const dir = this.getQrBgUserDataDirForUser(userId);
      if (!electronFs?.existsSync || !electronFs.existsSync(dir)) return null;
      const files: string[] = electronFs.readdirSync(dir) as string[];
      const match = (files || []).find(f => /^qr-background\.(png|jpe?g|jpe|jfif|webp|gif|bmp|svg)$/i.test(String(f)));
      return match ? electronPath.join(dir, match) : null;
    } catch {
      return null;
    }
  }

  private loadSavedQrBgForCurrentUser() {
    try {
      const userId = this.getCurrentUserIdText();
      const fromStore = this.localStoreService.getItem(this.getQrBgStorageKey());
      const candidate = fromStore && electronFs?.existsSync && electronFs.existsSync(fromStore)
        ? fromStore
        : this.findSavedQrBgInUserData(userId);

      if (candidate) {
        this.qrBackgroundImagePath = candidate;
        this.qrBackgroundImagePreviewUrl = this.filePathToDataUrl(candidate);
        // Refresh the storage pointer if it was missing/old.
        this.localStoreService.setItem(this.getQrBgStorageKey(), candidate);
        this.cdr.detectChanges();
        return;
      }

      // Fallback: restore from DataURL saved in localStorage
      const raw = this.localStoreService.getItem(this.getQrBgDataUrlStorageKey());
      const dataUrl = String(raw ?? '').trim();
      if (dataUrl && dataUrl.startsWith('data:image/')) {
        this.qrBackgroundImagePath = null;
        this.qrBackgroundImagePreviewUrl = dataUrl;
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Failed to load saved QR background image', e);
    }
  }

  private persistQrBgToUserData(srcPath: string | null, srcDataUrl: string | null): { path: string; previewDataUrl?: string } | null {
    const userId = this.getCurrentUserIdText();
    const destDir = this.getQrBgUserDataDirForUser(userId);
    if (!electronFs.existsSync(destDir)) {
      electronFs.mkdirSync(destDir, { recursive: true });
    }

    const ext = this.inferImageExtension(srcPath, srcDataUrl) ?? '.png';
    const destPath = electronPath.join(destDir, `qr-background${ext}`);

    if (srcPath && electronFs.existsSync(srcPath)) {
      const samePath = String(srcPath).toLowerCase() === String(destPath).toLowerCase();
      if (!samePath) {
        electronFs.copyFileSync(srcPath, destPath);
      }
      const preview = this.filePathToDataUrl(destPath);
      return { path: destPath, previewDataUrl: preview ?? undefined };
    }

    // Fallback: write from DataURL (when File.path isn't available)
    if (srcDataUrl && srcDataUrl.startsWith('data:')) {
      const match = srcDataUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) throw new Error('Invalid data URL');
      const base64 = match[2];

      // Avoid relying on global Buffer (can fail in TS builds without node typings)
      const NodeBuffer = (remote?.require ? remote.require('buffer')?.Buffer : null) || (electron?.remote?.require ? electron.remote.require('buffer')?.Buffer : null);
      if (!NodeBuffer) throw new Error('Buffer unavailable');
      const buf = NodeBuffer.from(base64, 'base64');

      electronFs.writeFileSync(destPath, buf);
      return { path: destPath, previewDataUrl: srcDataUrl };
    }

    return null;
  }

  private filePathToDataUrl(filePath: string): string | null {
    try {
      const ext = String(electronPath.extname(filePath) || '').toLowerCase();
      const mime =
        ext === '.jpg' || ext === '.jpeg' || ext === '.jpe' || ext === '.jfif' ? 'image/jpeg' :
          ext === '.webp' ? 'image/webp' :
            ext === '.gif' ? 'image/gif' :
              ext === '.bmp' ? 'image/bmp' :
                ext === '.svg' ? 'image/svg+xml' :
                  'image/png';
      const buf = electronFs.readFileSync(filePath);
      const b64 = buf.toString('base64');
      return `data:${mime};base64,${b64}`;
    } catch {
      return null;
    }
  }

  private inferImageExtension(srcPath: string | null, srcDataUrl: string | null): string | null {
    try {
      if (srcPath) {
        const ext = String(electronPath.extname(srcPath) || '').trim().toLowerCase();
        return ext ? ext : null;
      }
      if (srcDataUrl && srcDataUrl.startsWith('data:')) {
        if (srcDataUrl.startsWith('data:image/jpeg')) return '.jpg';
        if (srcDataUrl.startsWith('data:image/jpg')) return '.jpg';
        if (srcDataUrl.startsWith('data:image/pjpeg')) return '.jpg';
        if (srcDataUrl.startsWith('data:image/jfif')) return '.jpg';
        if (srcDataUrl.startsWith('data:image/webp')) return '.webp';
        if (srcDataUrl.startsWith('data:image/gif')) return '.gif';
        if (srcDataUrl.startsWith('data:image/bmp')) return '.bmp';
        if (srcDataUrl.startsWith('data:image/svg')) return '.svg';
        if (srcDataUrl.startsWith('data:image/png')) return '.png';
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getQrBgForFolderMaybeRotated(detail: any): Promise<{ qrBgPath: string | null; qrBgDataUrl: string | null }> {
    // This helper is invoked right before QR generation.
    // For now it simply resolves the best available background input (path preferred),
    // leaving any layout/rotation decisions to the QR generator in the Electron main process.
    try {
      // Prefer explicit in-memory selection
      const directPath = String(this.qrBackgroundImagePath ?? '').trim();
      if (directPath && electronFs?.existsSync && electronFs.existsSync(directPath)) {
        const dataUrl = this.qrBackgroundImagePreviewUrl ?? this.filePathToDataUrl(directPath);
        return { qrBgPath: directPath, qrBgDataUrl: dataUrl ?? null };
      }

      // If component state didn't have a path (or it went stale), try the persisted setting
      try {
        const fromStore = this.localStoreService.getItem(this.getQrBgStorageKey());
        const candidate = String(fromStore ?? '').trim();
        if (candidate && electronFs?.existsSync && electronFs.existsSync(candidate)) {
          const dataUrl = this.qrBackgroundImagePreviewUrl ?? this.filePathToDataUrl(candidate);
          return { qrBgPath: candidate, qrBgDataUrl: dataUrl ?? null };
        }
      } catch {
        // ignore
      }

      // Last resort: if we only have a DataURL, pass it through
      const dataUrlOnly = String(this.qrBackgroundImagePreviewUrl ?? '').trim();
      if (dataUrlOnly && dataUrlOnly.startsWith('data:')) {
        return { qrBgPath: null, qrBgDataUrl: dataUrlOnly };
      }

      // Final fallback: DataURL persisted in localStorage
      try {
        const raw = this.localStoreService.getItem(this.getQrBgDataUrlStorageKey());
        const savedDataUrl = String(raw ?? '').trim();
        if (savedDataUrl && savedDataUrl.startsWith('data:image/')) {
          return { qrBgPath: null, qrBgDataUrl: savedDataUrl };
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.error('Failed to resolve QR background image', e, detail);
    }

    return { qrBgPath: null, qrBgDataUrl: null };
  }

  private setupInternetAwareness() {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
      interval(3000).pipe(map(() => this.isOnlineNow())) // 3s polling as requested
    )
      .pipe(
        startWith(this.isOnlineNow()),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((isOnline) => {
        this.online$.next(isOnline);

        // Flip current folder status immediately when connectivity changes (no index/progress resets)
        if (!this.currentProcessingFolder) return;

        if (!isOnline) {
          this.setFolderStatus(this.currentProcessingFolder, 'Waiting for Internet');
        } else {
          // Only flip back if we were paused for internet
          if (this.currentProcessingFolder.Status === 'Waiting for Internet') {
            this.setFolderStatus(this.currentProcessingFolder, 'In Progress');
          }
        }
      });
  }

  private waitForInternet$(): Observable<void> {
    if (this.isOnlineNow()) return of(void 0);

    // Wait until online using BOTH window events and 3-second polling; complete once online.
    return merge(
      fromEvent(window, 'online').pipe(map(() => this.isOnlineNow())),
      fromEvent(window, 'offline').pipe(map(() => this.isOnlineNow())),
      interval(3000).pipe(map(() => this.isOnlineNow()))
    ).pipe(
      startWith(this.isOnlineNow()),
      tap((isOnline) => this.online$.next(isOnline)),
      filter((isOnline) => isOnline),
      take(1),
      map(() => void 0),
      takeUntil(this.destroy$)
    );
  }

  private runWhenOnline<T>(folder: FolderDetailMetaData | null, fn: () => Observable<T>): Observable<T> {
    return defer(() => {
      if (!this.isOnlineNow()) {
        if (folder) this.setFolderStatus(folder, 'Waiting for Internet');
        return this.waitForInternet$().pipe(
          tap(() => {
            if (folder) this.setFolderStatus(folder, 'In Progress');
          }),
          switchMap(() => fn())
        );
      }
      return fn();
    }).pipe(
      catchError((err) => {
        // If we went offline mid-call: pause and retry the SAME call (resume from exact file/API).
        if (!this.isOnlineNow()) {
          if (folder) this.setFolderStatus(folder, 'Waiting for Internet');
          return this.waitForInternet$().pipe(
            tap(() => {
              if (folder) this.setFolderStatus(folder, 'In Progress');
            }),
            switchMap(() => fn())
          );
        }
        // Non-internet error should bubble to preserve existing behavior
        return throwError(() => err);
      })
    );
  }

  private setFolderStatus(folder: FolderDetailMetaData, status: string) {
    const folderName = folder?.FolderName;
    const canonical = folderName ? this.folderDetail?.find(x => x.FolderName === folderName) : null;

    // Always update the canonical item (folderDetail) when available.
    if (canonical) {
      canonical.Status = status;
    } else {
      folder.Status = status;
    }

    const mirror = folderName ? this.allfolderDetail?.find(x => x.FolderName === folderName) : null;
    if (mirror) mirror.Status = status;

    // keep UI in sync
    this.cdr.detectChanges();
  }

  excelDetail(data: any, saveInfo: any) {
    let excelData = {
      projectname: saveInfo.CoupleName,
      email: saveInfo.EmailAddress,
      photographername: data.Profile.FullName,
      totalphoto: saveInfo.FolderImages.length,
      ealbumcode: data.AlbumDetail.UniqId,
      status: saveInfo.Status,
      mobileno: data.Profile.Phone
    }
    this.excelDetailData.push(excelData);

    this.excelExport.exportExcel(this.excelDetailData, electronFs, this.selectedDirectory);

    setTimeout(() => {
      this.excelUrl = this.selectedDirectory + "/mobiebook.xlsx";
    }, 1000)
  }

  loadFolder() {

    // this.imageService.images.subscribe((value) => {
    //   console.log(value);
    //   this.images = value;
    //   this.cdr.detectChanges();
    // });

    // this.imageService.directory.subscribe((value) => {
    //   console.log(value);
    //   this.directory = value;
    //   this.cdr.detectChanges();
    // });
  }

  folder: string | undefined;

  startWatching(path: any) {
    if (this.currentWatcher) {
      this.currentWatcher.close();
      this.currentWatcher = undefined;
    }

    try {
      this.currentWatcher = electronFs.watch(path, { persistent: true, recursive: true }, (eventType: any, filename: any) => {
        this.ngZone.run(() => {
          this.checkForNewFolders(path);
        });
      });
    } catch (error) {
    }
  }

  checkForNewFolders(path: any) {
    let files = FileTree.readDir(path);
    let currentFolderNames = this.folderDetail.map(x => x.FolderName);
    let hasChanges = false;
    files.forEach((row: any) => {
      if (row.isdirective) {
        if (!currentFolderNames.includes(row.name)) {
          this.processSingleFolder(row);
          hasChanges = true;
        } else {
          // Update existing folder content
          let existingFolder = this.folderDetail.find(x => x.FolderName == row.name);
          if (existingFolder) {
            let newCount = this.fileCount(row);
            if (existingFolder.FolderImages && (existingFolder.Counter !== newCount || existingFolder.FolderImages.length !== row.items.length)) {
              existingFolder.FolderImages = row.items;
              existingFolder.Counter = newCount;

              // Mandatory cover validation on changes
              const coverErr = this.getMissingCoverError(row.items, row.name);
              if (coverErr) {
                existingFolder.Status = "Invalid";
                existingFolder.ErrorDetail = coverErr.message.split('\n')[0]; // keep ErrorDetail short
                this.alertMissingCoversOnce(row.name, coverErr.message);
                hasChanges = true;
                return;
              } else if (existingFolder.Status === "Invalid" &&
                (existingFolder.ErrorDetail?.toLowerCase?.().includes('front cover') || existingFolder.ErrorDetail?.toLowerCase?.().includes('back cover'))) {
                // covers fixed -> allow back to Open (order-file rule still applies below)
                existingFolder.Status = "Open";
                existingFolder.ErrorDetail = "";
              }

              // If it was invalid due to missing text file, re-check
              if (existingFolder.Status === "Invalid" && existingFolder.ErrorDetail === "Order file not found") {
                let orderFile = this.getTxtFilePath(row.items);
                if (orderFile != "") {
                  existingFolder.FolderTextFile = orderFile;
                  existingFolder.Status = "Open";
                  existingFolder.ErrorDetail = "";
                  this.readText(existingFolder.FolderTextFile, row.name);
                }
              }
              hasChanges = true;
            }
          }
        }
      }
    });

    if (hasChanges) {
      // Refresh the table without deep-cloning items (keep object identity so status stays consistent)
      this.allfolderDetail = this.folderDetail.slice();
      this.cdr.detectChanges();
    }
  }

  processSingleFolder(x: any) {
    if (x.isdirective == false)
      return;

    let row = x;

    // Mandatory cover validation (popup + mark invalid)
    const coverErr = this.getMissingCoverError(row.items, row.name);
    if (coverErr) {
      let fold = new FolderDetailMetaData();
      fold.FolderName = row.name;
      fold.PageType = this.inferDefaultAlbumPageType(row.items);
      fold.FolderTextFile = this.getTxtFilePath(row.items);
      fold.IsProcess = false;
      fold.EAlbumId = 0;
      fold.FolderPath = row.path;
      fold.Counter = this.fileCount(row);
      fold.FolderImages = row.items;
      fold.Status = "Invalid";
      fold.ErrorDetail = coverErr.message.split('\n')[0];
      this.folderDetail.push(fold);

      this.alertMissingCoversOnce(row.name, coverErr.message);

      this.allfolderDetail = this.folderDetail.slice();
      return;
    }

    let orderFile = this.getTxtFilePath(row.items);
    let fold = new FolderDetailMetaData();
    fold.FolderName = row.name;
    fold.PageType = this.inferDefaultAlbumPageType(row.items);
    fold.FolderTextFile = orderFile;
    fold.IsProcess = false;
    fold.EAlbumId = 0;
    fold.FolderPath = row.path;
    if (orderFile == "") {
      fold.Counter = 0;
      fold.FolderImages = row.items;
      fold.Status = "Invalid"
      fold.ErrorDetail = "Order file not found";
      this.folderDetail.push(fold);
    } else {
      fold.Counter = this.fileCount(row);
      fold.FolderImages = row.items;
      fold.Status = "Open"
      this.folderDetail.push(fold);

      this.readText(fold.FolderTextFile, row.name);
      let itemDetail = this.logDetail(row.items)
      this.readLogText(row.path, itemDetail, row.name)
    }

    this.allfolderDetail = this.folderDetail.slice();
  }

  browse() {
    var directory = dialog.showOpenDialog({ properties: ['openDirectory'] })
      .then((x: any) => {
        this.excelDetailData = [];
        debugger;

        var fileTree = new FileTree(x.filePaths[0]);
        let isMainFolder = fileTree.isImageFolder(x.filePaths[0]);
        let folderDetail = [];
        if (isMainFolder) {
          this.selectedDirectory = x.filePaths[0];
          let folderName = this.selectedDirectory.split('\\')
          fileTree.name = folderName[folderName.length - 1];
          fileTree.items = FileTree.readDir(x.filePaths[0])
          folderDetail.push(fileTree);
        }
        else {
          fileTree.build();
          folderDetail = fileTree.items;
          this.selectedDirectory = fileTree.path;
        }



        this.directory = [];
        this.folderDetail = [];

        folderDetail.forEach(x => {
          this.processSingleFolder(x);
        });

        this.startWatching(this.selectedDirectory);
      });
  }

  navigateDirectory(path: any) {
    this.imageService.navigateDirectory(path);
  }

  logDetail(itemDetal: any[]) {
    let item: any[] = [];
    for (let i = 0; i < itemDetal.length; i++) {
      let row = itemDetal[i];
      let ext = this.getExtention(row.name);
      if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg" || ext.toString().toLowerCase() === ".png") {
        let detail = {
          Name: row.name,
          Status: 'Open'
        }
        item.push(detail)
      }

    }
    return item;
  }


  fileCount(items: any) {
    let i = 0;
    if (items.items.length > 0) {

      for (let j = 0; j < items.items.length; j++) {
        let row = items.items[j];
        let ext = this.getExtention(row.name);
        if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg" || ext.toString().toLowerCase() === ".png") {
          i++;
        }
      }
    }
    return i;
  }

  getExtention(fileName: any): string {
    const name = Array.isArray(fileName) ? fileName.join('') : (fileName ?? '').toString();
    const i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i);
  }

  getTxtFilePath(detail: any[]) {
    let path = "";
    for (let p = 0; p < detail.length; p++) {
      let ext = this.getExtention(detail[p].name);
      if (ext === ".txt") {
        path = detail[p].path;
      }
    }
    return path;
  }

  readText(path: any, name: any) {

    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", "file:///" + path, false);
    var rows = this.folderDetail;
    let rowDetail = this;
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        if (rawFile.status === 200 || rawFile.status == 0) {
          var allText = rawFile.responseText;
          let fold = rows.find(x => x.FolderName == name);
          if (fold != undefined) {
            let detail = allText.split('\n');
            let str = rowDetail.getEmail(detail);
            if (str != "") {
              fold.EmailAddress = str;
            }
            let coupleName = rowDetail.getCoupleName(detail);
            if (coupleName != "") {
              fold.CoupleName = coupleName;
            }
          }
        }
      }
    }
    rawFile.send(null);
  }

  isEmail(str: any) {
    let n = str.search("Email");
    let no = str.search("email")
    if (n >= 0 || no >= 0) {
      return true;
    }
    return false;
  }

  splitText(str: any) {
    let comma = str.search(":");
    if (comma >= 0) {
      return ":";
    }

    let semiComma = str.search(";");
    if (semiComma >= 0) {
      return ";";
    }

    let singleComma = str.search("=");
    if (singleComma >= 0) {
      return "=";
    }

    let hyphan = str.search("-");
    if (hyphan >= 0) {
      return "-";
    }


    return null;
  }

  getEmail(detail: any[]) {
    let emailAddress = "";
    for (let e = 0; e < detail.length; e++) {
      let isEmail = this.isEmail(detail[e]);
      if (isEmail) {
        let splitText = this.splitText(detail[e]);
        if (splitText != null) {
          let row = detail[e].split(splitText);
          if (row.length > 0) {
            emailAddress = row[1].toLowerCase().trim();
          }
        }

      }
    }
    return emailAddress;
  }

  getCoupleName(detail: any[]) {
    let coupleName = "";
    for (let e = 0; e < detail.length; e++) {
      let row = detail[e].split(":");
      if (row.length > 0) {
        let n = row[0].search("Couple");
        let no = row[0].search("couple")
        if (n >= 0 || no >= 0) {
          coupleName = row[1];
        }
      }
    }
    return coupleName;
  }


  ProcessAllImage() {
    if (this.selectedAudioId > 0) {
      if (this.isAllProcess == false && this.isCancel == false) {
        this.isAllProcess = true;
        let row = this.folderDetail.find(x => x.Status == "Open");
        if (row != undefined) {
          this.saveEalbumInfo(row);
        }
        else {
          this.isAllProcess = false;
        }
      }
      else {
        this.isCancel = false;
      }
    }
    else {
      alert("Please choose audio before process");
    }


  }

  totalFileCount(items: any) {
    let i = 0;
    if (items.length > 0) {
      for (let j = 0; j < items.length; j++) {
        let row = items[j];
        let ext = this.getExtention(row.name);
        if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg" || ext.toString().toLowerCase() === ".png") {
          i++;
        }
      }
    }
    return i;
  }

  albumDetail: any[] = [];
  ProcessRow(detail: any, albumDetail: any) {
    debugger;
    let imgs = detail.FolderImages;

    // Track currently processing folder for online/offline status flips
    this.currentProcessingFolder = detail;

    let details = this;
    let processImgCounter = 0;
    this.changeSequence(imgs);

    let saveImg: any[] = []
    let counter = this.totalFileCount(imgs);

    imgs.forEach(async (row: { name: string | string[]; path: string; SequenceNo: number; }) => {
      let ext = this.getExtention(row.name);
      if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg" || ext.toString().toLowerCase() === ".png") {
        this.getFileObject("file:///" + row.path, row.name, function (fileObject: any) {
          details.attachImage(fileObject, detail.PageType).subscribe((x) => {
            const computedViewType = details.pageType(x.name);

            const uniqid = `${Date.now()}-${row.SequenceNo}-${Math.random().toString(16).slice(2)}`;

            saveImg.push({
              upload$: () => details.saveImagesObservable(x, row.SequenceNo, computedViewType, detail.PageType, detail, uniqid),
              imgName: row.name,
              viewtype: computedViewType,
              pagetype: detail?.PageType
            });

            processImgCounter = processImgCounter + 1;
            if (processImgCounter == counter) {
              details.ProcessImages(saveImg, detail, albumDetail);
            }
          });
        });
      }
    })
  }

  ProcessImages(imageDetail: any[], detail: any, albumDetail: any) {
    // Track currently processing folder for online/offline status flips
    this.currentProcessingFolder = detail;

    let completed = 0;

    from(imageDetail)
      .pipe(
        concatMap((meta: any) =>
          this.runWhenOnline(detail, () => meta.upload$())
            .pipe(map((event: any) => ({ event, meta })))
        )
      )
      .subscribe((payload: any) => {
        const event = payload.event;
        const meta = payload.meta;

        if (event.type === HttpEventType.UploadProgress) {
          // keep as-is (no reset on offline)
        } else if (event instanceof HttpResponse) {
          completed = completed + 1;

          if (completed >= imageDetail.length) {
            this.setFolderStatus(detail, "Done");

            // Generate album QR in Electron MAIN via IPC (do not block or break existing flow)
            try {
              const resolvedUniqId =
                detail?.uniq_id ??
                detail?.UniqId ??
                albumDetail?.AlbumDetail?.UniqId ??
                albumDetail?.UniqId;

              const resolvedUniqIdText = String(resolvedUniqId ?? '').trim();
              if (!resolvedUniqIdText || resolvedUniqIdText.toLowerCase() === 'null' || resolvedUniqIdText.toLowerCase() === 'undefined') {
                console.error('QR not generated: uniq id missing/invalid', resolvedUniqId);
              } else {
                (async () => {
                  const bg = await this.getQrBgForFolderMaybeRotated(detail);

                  const payload = {
                    FolderPath: detail.FolderPath,
                    uniq_id: resolvedUniqIdText,
                    qrBgPath: bg.qrBgPath,
                    qrBgDataUrl: bg.qrBgDataUrl,
                    generateBarcode: this.qrGenerateBarcode,
                    barcodeText: String(detail?.FolderName ?? '').trim(),
                    printFolderNameBelowBarcode: this.qrPrintFolderNameBelowBarcode,
                    pageType: (detail?.PageType ?? albumDetail?.AlbumDetail?.PageType ?? albumDetail?.PageType)
                  };

                  if (electron?.ipcRenderer?.invoke) {
                    electron.ipcRenderer.invoke('generate-qr', payload)
                      .then((res: any) => {
                        if (res?.ok) {
                          console.log('QR generated:', res.outPath, 'URL:', res.url);
                        } else {
                          console.error('QR generation failed:', res?.error || res);
                        }
                      })
                      .catch((err: any) => console.error('QR IPC invoke error:', err));
                  } else {
                    console.error('ipcRenderer.invoke not available; cannot generate QR');
                  }
                })().catch((e: any) => console.error('QR bg rotate/prepare error:', e));
              }
            } catch (e) {
              console.error('QR generation trigger error:', e);
            }

            var allData = this.allfolderDetail.find(x => x.FolderName == detail.FolderName);
            if (allData != undefined) {
              allData.Status = "Done";
              this.excelDetail(albumDetail, detail);
            }
            this.updateImageStatus(detail, "DONE");

            // done -> clear current processing folder reference
            this.currentProcessingFolder = null;

            if (this.isAllProcess && !this.isCancel) {
              this.isAllProcess = false;
              this.ProcessAllImage();
            } else {
              this.isAllProcess = false;
            }
          }
        }
      },
      // If an error occurs while online, keep existing behavior (do not silently swallow unknown errors)
      (err: any) => {
        // If offline, runWhenOnline already paused/retried; reaching here is a non-internet error.
      });
  }

  updateImageStatus(detail: any, imgName: string) {
    try {
      let log = JSON.parse(detail.ItemLog)
      if (log != null && log != undefined) {
        log.forEach((element: any) => {
          element.Status = "Done";
        });
      }
      detail.ItemLog = JSON.stringify(log);

      this.log(detail.FolderPath, log);
    }
    catch (error) {

    }

  }

  changeSequence(images: any) {
    // 1. Sort all names alphanumerically first to establish baseline order for pages
    let imgName = images.map((x: any) => x.name);
    if (typeof alphaNumericSort === "function") {
      alphaNumericSort(imgName);
    } else {
      imgName.sort(); // Fallback
    }

    // 2. Buckets for special pages
    let front: any[] = [];
    let blanks: any[] = [];
    let emboss: any[] = [];
    let frontTP: any[] = [];
    let pages: any[] = [];
    let backTP: any[] = [];
    let back: any[] = [];

    // 3. Map for lookup
    let imageMap = new Map();
    images.forEach((img: any) => imageMap.set(img.name, img));

    // 4. Distribute based on pageType
    // Iterating through sorted imgName ensures 'pages' bucket ends up sorted
    imgName.forEach((name: any) => {
      let img = imageMap.get(name);
      if (img) {
        let pType = this.pageType(name);
        if (pType === 'FRONT') front.push(img);
        else if (pType === 'BLANK') blanks.push(img);
        else if (pType === 'EMBOSS') emboss.push(img);
        else if (pType === 'TPFRONT') frontTP.push(img);
        else if (pType === 'TPBACK') backTP.push(img);
        else if (pType === 'BACK') back.push(img);
        else pages.push(img);
      }
    });

    // 5. Concatenate in correct order
    // Order: Front Cover -> Blank -> Front TP -> Blank -> Emboss -> Standard Pages -> Back TP -> Back Cover
    let finalOrder = [
      ...front,
      ...blanks.slice(0, 1),
      ...frontTP,
      ...blanks.slice(0, 1),
      ...emboss,
      ...blanks.slice(2),
      ...pages,
      ...backTP,
      ...back
    ];

    // 6. Assign SequenceNo
    finalOrder.forEach((img: any, index: number) => {
      img.SequenceNo = index + 1;
    });
  }

  // alphaNumericSort = (arr = []) => {
  //   const sorter = (a: any, b: any) => {
  //     const isNumber = (v: any) => (+v).toString() === v;                                  nb                      e
  //     const aPart = a.match(/\d+|\D+/g);
  //     const bPart = b.match(/\d+|\D+/g);
  //     let i = 0; let len = Math.min(aPart.length, bPart.length);
  //     while (i < len && aPart[i] === bPart[i]) { i++; };
  //     if (i === len) {
  //       return aPart.length - bPart.length;
  //     };
  //     if (isNumber(aPart[i]) && isNumber(bPart[i])) {
  //       return aPart[i] - bPart[i];
  //     };
  //     return aPart[i].localeCompare(bPart[i]);
  //   };
  //   arr.sort(sorter);
  // };
  pageType(name: string) {
    if (!name) return 'PAGE';

    // Remove extension, lowercase and normalize separators so "emboss_01", "emboss-1", "emboss 1" all match
    const lastIndex = name.lastIndexOf('.');
    let file = lastIndex > -1 ? name.substring(0, lastIndex) : name;
    file = file.toLowerCase().trim();
    // replace underscores/hyphens with space and collapse multiple spaces
    const normalized = file.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

    // FRONT COVER
    if (/^(c1|front( |$)|front cover|frontcover)$/.test(normalized)) return 'FRONT';

    // BACK COVER
    if (/^(c2|back( |$)|back cover|backcover)$/.test(normalized)) return 'BACK';

    // FRONT TP
    if (/^(f1|front( |)tp|first page|front tp)$/.test(normalized)) return 'TPFRONT';

    // BACK TP
    if (/^(f2|back( |)tp|last page|back tp)$/.test(normalized)) return 'TPBACK';

    // EMBOSS - match e1, e-1, emb, emboss, embose and variants.
    // Also supports names that *contain* emboss like "32metalicemboss" or "001RIGHTSIDEMETALICEMBOSS".
    // Examples matched: e1, e-1, emb, emboss, embose, emboss1, emboss01, emb01, emboss 1, 32metalicemboss
    if (
      /^e-?1$/.test(normalized) ||
      /^emb(?:oss|ose)?(?:\s*\d*)?$/.test(normalized) ||
      normalized === 'emb' ||
      normalized.includes('emboss') ||
      normalized.includes('embose')
    ) {
      return 'EMBOSS';
    }

    // BLANK
    if (/^b\d*$/.test(normalized) || /^blank( |$)/.test(normalized) || normalized === 'black') return 'BLANK';

    return 'PAGE';
  }

  private isImageFileName(name: any): boolean {
    if (!name || typeof name !== 'string') return false;
    const ext = this.getExtention(name);
    if (!ext) return false;
    const e = ext.toString().toLowerCase();
    return e === '.jpg' || e === '.jpeg' || e === '.png';
  }

  private getMissingCoverError(items: any[], folderName?: string): { missingFront: boolean; missingBack: boolean; message: string } | null {
    const safeItems = Array.isArray(items) ? items : [];
    const hasFront = safeItems.some(f => this.isImageFileName(f?.name) && this.pageType(f.name) === 'FRONT');
    const hasBack = safeItems.some(f => this.isImageFileName(f?.name) && this.pageType(f.name) === 'BACK');

    const missingFront = !hasFront;
    const missingBack = !hasBack;

    if (!missingFront && !missingBack) return null;

    const parts: string[] = [];
    if (missingFront) parts.push('Front cover is mandatory');
    if (missingBack) parts.push('Back cover is mandatory');

    // Keep popup text exactly as requested, but include folder name for clarity (optional).
    const message = folderName ? `${parts.join('\n')}\n\nFolder: ${folderName}` : parts.join('\n');
    return { missingFront, missingBack, message };
  }

  private alertMissingCoversOnce(folderName: any, message: string) {
    const key = (folderName ?? '').toString();
    if (!key) {
      alert(message);
      return;
    }
    if (this.coverAlertShownForFolder.has(key)) return;
    this.coverAlertShownForFolder.add(key);
    alert(message);
  }

  getFileBlob = function (url: string, cb: (arg0: any) => void) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.addEventListener('load', function () {
      cb(xhr.response);
    });
    xhr.send();
  };

  blobToFile = function (blob: { lastModifiedDate: Date; name: any; }, name: any) {
    blob.lastModifiedDate = new Date();
    blob.name = name;
    return blob;
  };

  getFileObject(filePathOrUrl: any, filename: any, cb: any) {
    let detail = this;
    this.getFileBlob(filePathOrUrl, function (blob: any) {
      cb(detail.blobToFile(blob, filename));
    });
  };



  attachImage(file: any, viewType: any): Observable<any> {
    let width = 1024;
    if (viewType == IMG_TYPE.Spread) {
      width = 2048;
    }
    const options = {
      targetSize: 0.5,
      quality: 0.75,
      maxWidth: width,
      maxHeight: 768
    }
    return new Observable((observer: { next: (arg0: File) => void; complete: () => void; }) => {
      const compress = new Compress(options)
      compress.compress([file])
        .then((conversion: { photo: any; info: any; }[]) => {
          const { photo, info } = conversion[0];
          var compressFile = new File([photo.data], file.name, { type: file.type });
          observer.next(compressFile);
          observer.complete();
        })
    });

  }

  saveEalbumInfo(saveInfo: any) {
    debugger;

    const folderName = String(saveInfo?.FolderName ?? '').trim();
    const canonical = folderName ? (this.folderDetail.find(x => x.FolderName === folderName) ?? saveInfo) : saveInfo;

    // Track currently processing folder for online/offline status flips
    this.currentProcessingFolder = canonical;

    // NEW: spread validation gate (do not change existing ealbum flow; just block early)
    const spreadCheck = this.validateSpreadLimits(saveInfo?.FolderImages, saveInfo?.PageType);
    if (!spreadCheck.ok) {
      const msg = spreadCheck.message ?? 'Invalid album page/spread configuration';
      alert(msg);

      this.setFolderStatus(canonical, "Invalid");
      canonical.ErrorDetail = msg;
      const mirror = folderName ? this.allfolderDetail.find(x => x.FolderName === folderName) : null;
      if (mirror) mirror.ErrorDetail = msg;

      // keep existing "ALL process" behavior: skip this folder and continue with next Open
      if (this.isAllProcess == true) {
        this.isAllProcess = false;
        this.ProcessAllImage();
      }
      return;
    }

    if (this.selectedAudioId <= 0) {
      alert("Please choose audio before process");
      return;
    }

    let eventDate = new Date();
    let addAlbum = new AddAlbumMetaData();

    if (saveInfo.EmailAddress != undefined && saveInfo.EmailAddress != "" && saveInfo.EmailAddress != null) {
      // IMPORTANT: gate API call on internet availability (pause/resume)
      this.runWhenOnline(canonical, () => this.ealbumService.getPhotographerId(String(saveInfo.EmailAddress).trim()))
        .subscribe((photographerId: any) => {
          if (photographerId > 0) {
            this.setFolderStatus(canonical, "In Progress");

            addAlbum.AlbumId = 0;
            addAlbum.EventTitle = "";
            addAlbum.CoupleDetail = canonical.CoupleName;
            addAlbum.AudioId = this.selectedAudioId;
            if (this.selectedAudioId <= 0) {
              if (this.albums.length > 0) {
                addAlbum.AudioId = this.albums[0].AudioId
              }
            }
            addAlbum.EventDate = eventDate;
            addAlbum.Remark = "";
            addAlbum.EmailAddress = canonical.EmailAddress;
            addAlbum.MobileNo = "";
            addAlbum.PageType = canonical.PageType;
            addAlbum.PhotographerId = photographerId;

            // mirror status already set via setFolderStatus

            // Gate album-create API call on internet availability (pause/resume)
            this.runWhenOnline(canonical, () => this.ealbumService.addLabAlbumDetail(addAlbum))
              .subscribe((data: any) => {
                canonical.EAlbumId = data.ealbumId;
                canonical.PhotographerId = photographerId;
                this.ProcessRow(canonical, data);
              },
              (error: any) => {
                const rawMsg =
                  (error?.error?.message ??
                    error?.error?.Message ??
                    error?.message ??
                    (typeof error?.error === 'string' ? error.error : '')
                  )?.toString?.() ?? '';

                const isDuplicate = error?.status === 500 && rawMsg.includes('Duplicate entry');

                alert(
                  isDuplicate
                    ? 'Mobiebook code already exists. Please use a different code.'
                    : 'Something went wrong while saving ebook. Please try again.'
                );
              });

          } else {
            this.setFolderStatus(canonical, "Invalid");
            canonical.ErrorDetail = "Invalid photographer email";
            const allData2 = folderName ? this.allfolderDetail.find(x => x.FolderName === folderName) : null;
            if (allData2) allData2.ErrorDetail = "Invalid photographer email";

            if (this.isAllProcess == true) {
              this.isAllProcess = false;
              this.ProcessAllImage();
            }
          }
        },
        (error: any) => {
          // non-internet error: keep existing behavior (no reset)
        });

    } else {
      this.setFolderStatus(canonical, "Invalid");
      canonical.ErrorDetail = "email id not found/incorrect";
      const allData = folderName ? this.allfolderDetail.find(x => x.FolderName === folderName) : null;
      if (allData) allData.ErrorDetail = "email id not found/incorrect";

      if (this.isAllProcess == true) {
        this.isAllProcess = false;
        this.ProcessAllImage();
      }
    }
  }

  private validateSpreadLimits(images: any[], selectedPageType?: any): { ok: boolean; message?: string } {
    if (!Array.isArray(images)) return { ok: true };

    const pageTypeText = String(selectedPageType ?? '').trim().toLowerCase();
    const isPageMode = pageTypeText === 'page';

    let frontTP = 0;
    let backTP = 0;
    let emboss = 0;
    let insidePages = 0;

    images.forEach(img => {
      if (!this.isImageFileName(img?.name)) return;

      const type = this.pageType(img.name);

      if (type === 'TPFRONT') frontTP++;
      else if (type === 'TPBACK') backTP++;
      else if (type === 'EMBOSS') emboss++;
      else if (type === 'PAGE') insidePages++;
    });

    // Rule 1: inside pages must be EVEN (only applicable when PageType is "Page")
    if (isPageMode && (insidePages % 2 !== 0)) {
      return {
        ok: false,
        message: 'Inside pages count must be even'
      };
    }

    const insideSpreads = insidePages / 2;
    const totalSpreads = insideSpreads + frontTP + backTP + emboss;

    // Rule 2: max 72 spreads
    if (totalSpreads > this.MAX_SPREADS) {
      return {
        ok: false,
        message: `Maximum ${this.MAX_SPREADS} spreads allowed. Current: ${totalSpreads}`
      };
    }

    return { ok: true };
  }

  private inferDefaultAlbumPageType(items: any[]): string {
    // Default behavior historically was Spread. Only switch to Page when we can
    // confidently determine the folder contains portrait-only images.
    try {
      const safeItems = Array.isArray(items) ? items : [];
      const imageItems = safeItems
        .filter((it: any) => it && typeof it.name === 'string' && typeof it.path === 'string')
        .filter((it: any) => this.isImageFileName(it.name))
        .filter((it: any) => String(it.name).toLowerCase() !== 'album-qr.png');

      if (!imageItems.length) return 'Spread';

      let sizeOf: any;
      try {
        sizeOf = (<any>window).require ? (<any>window).require('image-size') : null;
      } catch {
        sizeOf = null;
      }
      if (!sizeOf) return 'Spread';

      let seenPortrait = false;
      let seenLandscape = false;

      // Sample a few images for speed; filenames are already validated.
      const sample = imageItems.slice(0, 8);
      for (const it of sample) {
        let dim: any;
        try {
          dim = sizeOf(it.path);
        } catch {
          continue;
        }
        const w = Number(dim?.width);
        const h = Number(dim?.height);
        if (!(w > 0 && h > 0)) continue;
        if (h >= w) seenPortrait = true; else seenLandscape = true;
        if (seenPortrait && seenLandscape) return 'Spread';
      }

      if (seenPortrait && !seenLandscape) return 'Page';
      if (seenLandscape && !seenPortrait) return 'Spread';
      return 'Spread';
    } catch {
      return 'Spread';
    }
  }

  saveImagesObservable(img: File, seq: number, pageType: any, imageType: any, detail: any, uniqid?: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', img, img.name);
    formData.append('albumid', detail.EAlbumId.toString());
    formData.append('pagetype', imageType);
    formData.append('viewtype', pageType);
    formData.append('size', this.ealbumService.byteFormat(img.size));
    formData.append('sequenceno', (seq).toString());
    formData.append('uniqid', (uniqid ?? Date.now().toString()));
    formData.append('parentid', "");
    formData.append('isdisplay', 'true');
    formData.append('photographerid', detail.PhotographerId.toString());

    if (pageType === 'EMBOSS') {
      console.log('[MobieBook][EMBOSS] sending', {
        fileName: img?.name,
        seq,
        pagetype: imageType,
        viewtype: pageType,
        albumid: detail?.EAlbumId,
        photographerid: detail?.PhotographerId
      });
    }

    if (this.enableUploadDebugLog) {
      this.appendJsonLine(detail?.FolderPath, 'upload-debug.jsonl', {
        ts: new Date().toISOString(),
        fileName: img?.name,
        seq,
        pagetype: imageType,
        viewtype: pageType,
        albumid: detail?.EAlbumId,
        photographerid: detail?.PhotographerId,
        sizeBytes: img?.size
      });
    }

    return this.ealbumService.upload(formData, "api/EAlbum/AcUploadPhotographerImage");
  }

  appendJsonLine(folderPath: any, fileName: string, data: any) {
    try {
      if (!folderPath || !fileName) return;
      const fullPath = folderPath + '/' + fileName;
      const line = JSON.stringify(data) + '\n';
      electronFs.appendFile(fullPath, line, (err: any) => {
        // Intentionally swallow errors; logging should never block uploads.
      });
    } catch (error) {
      // no-op
    }
  }


  log(path: any, data: any) {
    const logFile = electronFs.createWriteStream(path + '/log.txt', { flags: 'w' });
    setTimeout(() => {
      logFile.write(JSON.stringify(data) + '\n');
    }, 1000);
  }


  readLogText(path: any, itemDetail: any[], name: string) {
    let fileExist = this.doesFileExist(path + "/log.txt");
    if (fileExist == true) {
      var rawFile = new XMLHttpRequest();
      rawFile.open("GET", "file:///" + path + "/log.txt", false);
      var rows = this.folderDetail;
      let rowDetail = this;
      rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
          if (rawFile.status === 200 || rawFile.status == 0) {
            var allText = rawFile.responseText;
            try {
              let updateRow = []
              if (allText != undefined && allText != null && allText != "") {
                let val = JSON.parse(allText);

                for (let i = 0; i < itemDetail.length; i++) {
                  let row = itemDetail[i];

                  let isExist = val.find((x: any) => {
                    return x.Name === row.Name;
                  });
                  if (isExist != undefined) {
                    updateRow.push(isExist);
                  }
                  else {
                    updateRow.push(row);
                  }
                }
                rowDetail.log(path, updateRow);

                let isDone = true;
                updateRow.forEach(x => {
                  if (x.Status === "Open") {
                    isDone = false;
                  }
                })

                let fold = rows.find(x => x.FolderName == name);
                if (fold != undefined) {
                  fold.ItemLog = JSON.stringify(updateRow); // was itemDetail (didn't reflect merged statuses)
                  if (isDone) {
                    fold.Status = "Done";
                  }
                }
              }
              else {
                for (let i = 0; i < itemDetail.length; i++) {
                  let row = itemDetail[i];
                  updateRow.push(row);
                }
                rowDetail.log(path, updateRow);
              }
            }
            catch (err) {

            }
          }
        }
      }
      rawFile.send(null);
    }
    else {
      let fold = this.folderDetail.find(x => x.FolderName == name);
      if (fold != undefined) {
        fold.ItemLog = JSON.stringify(itemDetail);
      }
      this.log(path, itemDetail);
    }

  }

  doesFileExist(urlToFile: any) {
    try {
      if (electronFs.existsSync(urlToFile)) {
        return true;
      }
      else {
        return false;
      }
    }
    catch (err) {
      return false;
    }
  }

  getAudioDetail() {
    // Gate dropdown API call too (so app doesn't hard-fail when opened offline)
    this.runWhenOnline(null, () => this.ealbumService.getAudioDropdown())
      .subscribe((data: any) => {
        debugger;
        this.albums = data;
        this.albums = data;
        if (this.albums.length > 0 && this.selectedAudioId == 0) {
          let defaultAudio = this.albums.find(x => x.IsDefault == true);
          if (defaultAudio != undefined) {
            this.selectedAudioId = defaultAudio.AudioId;
            this.selected = defaultAudio.AudioId;
          }
          else {
            let favoriteAudio = this.albums.find(x => x.IsFavorite == true);
            if (favoriteAudio != undefined) {
              this.selectedAudioId = favoriteAudio.AudioId;
              this.selected = favoriteAudio.AudioId;
            }
            else {
              this.selectedAudioId = this.albums[0].AudioId;
              this.selected = this.albums[0].AudioId;
            }
          }
        }
      },
      error => {
        this.isAllProcess = false;
      });
  }

  audioFiles: AudioMetaData[] = [];
  attachAudioFile(event: any) {
    this.selected = -1;
    this.audioFiles = []
    if (event != null && event != undefined) {
      for (let i = 0; i < event.target.files.length; i++) {
        let row = event.target.files[i]
        let aud = new AudioMetaData();
        aud.AudioFile = row as File;
        aud.FileName = row.name;
        aud.Progress = 0;

        var FileSize = row.size / 1024 / 1024;
        if (FileSize <= 5) {
          this.audioFiles.push(aud);
        }
        else {
          alert("File size should be less than 5MB")
        }

      }

      if (this.audioFiles.length > 0) {
        this.addMp3Detail();
      }

    }
  }

  addMp3Detail(): void {
    for (let i = 0; i < this.audioFiles.length; i++) {
      let fileDetail = this.audioFiles[i];
      const formData: FormData = new FormData();
      formData.append('file', fileDetail.AudioFile as File, fileDetail.FileName);

      this.runWhenOnline(null, () => this.ealbumService.upload(formData, "api/Mp3/AddAudioWin"))
        .subscribe(
          (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              fileDetail.Progress = Math.round(100 * event.loaded / event.total);
            } else if (event instanceof HttpResponse) {
              this.selectedAudioId = event.body;
              this.getAudioDetail();
            }
          },
          (err: any) => {
            // non-internet error: keep existing behavior (no reset)
          }
        );
    }
  }

  viewMessage(msg: any) {
    alert(msg);
  }

  reload(detail: any) {
    debugger;
    let path = detail.FolderPath;
    var fileTree = FileTree.readDir(path);
    console.log("Filetree: ", fileTree);

    let rowDetail = this.folderDetail.find(x => x.FolderName == detail.FolderName);
    if (rowDetail != undefined) {
      // Mandatory cover validation (popup + mark invalid)
      const coverErr = this.getMissingCoverError(fileTree, detail.FolderName);
      if (coverErr) {
        rowDetail.Counter = this.fileCountSingle(fileTree);
        rowDetail.FolderImages = fileTree;
        rowDetail.Status = "Invalid";
        rowDetail.ErrorDetail = coverErr.message.split('\n')[0];
        this.alertMissingCoversOnce(detail.FolderName, coverErr.message);

        this.allfolderDetail = this.folderDetail.slice();
        return;
      }

      let orderFile = this.getTxtFilePath(fileTree);
      rowDetail.Counter = this.fileCountSingle(fileTree);
      rowDetail.FolderImages = fileTree;
      rowDetail.Status = "Open"
      this.readText(orderFile, detail.FolderName);

      let itemDetail = this.logDetail(fileTree)
      this.readLogText(path, itemDetail, detail.FolderName)

      this.allfolderDetail = this.folderDetail.slice();
    }
  }

  fileCountSingle(items: any) {
    let i = 0;
    if (items.length > 0) {

      for (let j = 0; j < items.length; j++) {
        let row = items[j];
        let ext = this.getExtention(row.name);
        if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg") {
          i++;
        }
      }
    }
    return i;
  }

  cancelProcess() {
    if (confirm("Are you sure you want to cancel?")) {
      this.isCancel = true;
    } else {

    }
  }

  SearchByStatus(id: any) {
    let val = id.target.value;
    if (val == "ALL") {
      this.allfolderDetail = this.folderDetail;
    }
    else {
      this.allfolderDetail = this.folderDetail.filter(x => x.Status == val);
    }
  }

  onOptionsSelected(event: any) {
    this.mp3File.nativeElement.value = "";
    const value = event.target.value;
    this.selectedAudioId = value;
    console.log(value);
  }

  browseFolder(path: any) {
    debugger;
    // let options = {
    //   // See place holder 1 in above image
    //   title: "View Excel File",

    //   // See place holder 2 in above image
    //   defaultPath: this.selectedDirectory,

    //   // See place holder 3 in above image

    //   // See place holder 4 in above image    
    //   properties: ['openFile']
    // }

    if (this.selectedDirectory != null && this.selectedDirectory != undefined) {
      this._electronService.shell.openPath(this.selectedDirectory);
    }

    //let filePaths = dialog.showOpenDialog(options)
  }

  trimStr(str: any) {
    if (str != undefined) {
      if (str.length > 20) {
        return str.substring(0, 20) + "...";
      }
      else {
        return str;
      }
    }
    return "";
  }


}
