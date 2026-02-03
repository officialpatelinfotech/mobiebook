import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ImagesService } from '../images.service';
import { FileTree } from '../model/filetree.metadata';
import { AudioMetaData, FolderDetailMetaData } from '../model/folderdetail.metadata';
import { from, fromEvent, Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, filter, map, retryWhen, switchMap, take, tap } from 'rxjs/operators';
import { AddAlbumMetaData } from '../model/addalbum.metadata';
import { EalbumService } from '../services/ealbum.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { PageViewType } from '../config/globalvariable';
import { ExcelExportService } from '../excel-export.service';

const Compress = require('client-compress')



declare var $: any;

const electron = (<any>window).require('electron');
var remote = electron.remote;
var electronFs = remote.require('fs');
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

  private readonly enableUploadDebugLog = true;
  private readonly coverAlertShownForFolder = new Set<string>();

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

  constructor(
    private _electronService: ElectronService,
    private imageService: ImagesService,
    private cdr: ChangeDetectorRef,
    private ealbumService: EalbumService,
    private excelExport: ExcelExportService,
    private ngZone: NgZone
  ) {

    this.statusList.push({ Id: 'ALL', Text: 'All' });
    this.statusList.push({ Id: 'Open', Text: 'Open' });
    this.statusList.push({ Id: 'In Progress', Text: 'In Progress' });
    this.statusList.push({ Id: 'Waiting', Text: 'Waiting for Internet' });
    this.statusList.push({ Id: 'Invalid', Text: 'Failed' });
    this.statusList.push({ Id: 'Done', Text: 'Success' });
  }

  ngOnInit(): void {
    this.getAudioDetail();
  }

  ngOnDestroy() {
    if (this.currentWatcher) {
      this.currentWatcher.close();
    }
  }

  private setStatus(detail: any, status: string, errorDetail: string = "") {
    if (!detail) return;
    detail.Status = status;
    if (typeof errorDetail !== 'undefined') {
      detail.ErrorDetail = errorDetail;
    }

    const allData = this.allfolderDetail?.find((x: any) => x.FolderName == detail.FolderName);
    if (allData) {
      allData.Status = status;
      if (typeof errorDetail !== 'undefined') {
        allData.ErrorDetail = errorDetail;
      }
    }
    this.cdr.detectChanges();
  }

  private isOfflineError(error: any): boolean {
    try {
      if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) return true;
    } catch { }

    if (!error) return false;

    // Upload requests bypass JwtInterceptor catchError, so these can be HttpErrorResponse
    if (typeof error === 'object') {
      const status = (error as any).status;
      if (status === 0) return true;
      const message = (error as any).message;
      if (typeof message === 'string' && /network error|cannot reach server|offline|failed to fetch/i.test(message)) return true;
      const errorText = (error as any).error;
      if (typeof errorText === 'string' && /network error|cannot reach server|offline/i.test(errorText)) return true;
      if ((error as any).name === 'ProgressEvent') return true;
    }

    // JSON requests pass through JwtInterceptor catchError, which throws a string
    if (typeof error === 'string') {
      return /network error|cannot reach server|offline/i.test(error);
    }

    return false;
  }

  private waitForOnline$(): Observable<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator && navigator.onLine === true) {
        return of(void 0);
      }
    } catch { }
    return fromEvent(window, 'online').pipe(take(1), map(() => void 0));
  }

  private retryWhenOffline(detail: any) {
    return (errors: Observable<any>) =>
      errors.pipe(
        switchMap((err) => {
          if (!this.isOfflineError(err)) {
            return throwError(() => err);
          }

          this.setStatus(detail, 'Waiting', 'Waiting for Internet');
          return this.waitForOnline$().pipe(
            tap(() => this.setStatus(detail, 'In Progress', ''))
          );
        })
      );
  }

  private normalizeError(err: any): string {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (typeof err?.message === 'string') return err.message;
    if (typeof err?.error === 'string') return err.error;
    try { return JSON.stringify(err); } catch { return String(err); }
  }

  private readLogFile(folderPath: string): any[] | null {
    try {
      const logPath = folderPath + '/log.txt';
      if (!electronFs.existsSync(logPath)) return null;
      const raw = electronFs.readFileSync(logPath, { encoding: 'utf8' });
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private async fileTreeToFile(fileNode: any): Promise<File> {
    const fullPath = fileNode?.path;
    const name = fileNode?.name;
    if (!fullPath || !name) {
      throw new Error('Invalid file node');
    }

    const ext = (this.getExtention(name) || '').toString().toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';

    const buffer: Uint8Array = await new Promise((resolve, reject) => {
      try {
        electronFs.readFile(fullPath, (err: any, data: any) => {
          if (err) return reject(err);
          // data is Node Buffer
          resolve(new Uint8Array(data));
        });
      } catch (e) {
        reject(e);
      }
    });

    // Ensure the backing store is a plain ArrayBuffer (avoids SharedArrayBuffer typing issues)
    const copied = new Uint8Array(buffer);
    return new File([copied.buffer], name, { type: mime });
  }

  private getImageTypeFromName(fileName: string): PageViewType {
    const n = (fileName || '').toLowerCase();
    if (n.includes('front') && n.includes('cover')) return PageViewType.Front;
    if (n.includes('back') && n.includes('cover')) return PageViewType.Back;
    return PageViewType.Page;
  }

  private getMissingCoverError(items: any[] | undefined, folderName?: string): { message: string } | null {
    if (!items || items.length === 0) return null;

    const files = items
      .filter(x => x && x.isdirective === false)
      .map(x => (x.name || '').toString().toLowerCase());

    const hasFront = files.some(n => n.includes('front') && n.includes('cover'));
    const hasBack = files.some(n => n.includes('back') && n.includes('cover'));

    if (hasFront && hasBack) return null;

    const missing: string[] = [];
    if (!hasFront) missing.push('Front cover');
    if (!hasBack) missing.push('Back cover');

    const name = folderName ? ` (${folderName})` : '';
    return {
      message: `${missing.join(' and ')} not found${name}. Please add the missing cover image(s).`
    };
  }

  private alertMissingCoversOnce(folderName: string, message: string) {
    try {
      if (!folderName) return;
      if (this.coverAlertShownForFolder.has(folderName)) return;
      this.coverAlertShownForFolder.add(folderName);
      alert(message);
    } catch {
      // no-op
    }
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
      let allFolder = JSON.stringify(this.folderDetail);
      this.allfolderDetail = JSON.parse(allFolder);
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
      fold.PageType = "Spread";
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

      let allFolder = JSON.stringify(this.folderDetail);
      this.allfolderDetail = JSON.parse(allFolder);
      return;
    }

    let orderFile = this.getTxtFilePath(row.items);
    let fold = new FolderDetailMetaData();
    fold.FolderName = row.name;
    fold.PageType = "Spread";
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

    let allFolder = JSON.stringify(this.folderDetail);
    this.allfolderDetail = JSON.parse(allFolder);
  }

  browse() {
    var directory = dialog.showOpenDialog({ properties: ['openDirectory'] })
      .then((x: any) => {
        this.excelDetailData = [];
        this.coverAlertShownForFolder.clear(); // allow alerts again for newly browsed root
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

  getExtention(fileName: string | string[]) {
    var i = fileName.lastIndexOf('.');
    if (i === -1) return false;
    return fileName.slice(i)
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

        // Skip any "Open" folder that fails mandatory cover validation
        let row = this.folderDetail.find(x => x.Status == "Open");
        while (row && !this.ensureMandatoryCoversOrInvalidate(row)) {
          row = this.folderDetail.find(x => x.Status == "Open");
        }

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

  private ensureMandatoryCoversOrInvalidate(detail: any): boolean {
    const coverErr = this.getMissingCoverError(detail?.FolderImages, detail?.FolderName);
    if (!coverErr) return true;

    detail.Status = "Invalid";
    detail.ErrorDetail = coverErr.message.split('\n')[0];

    const allData = this.allfolderDetail?.find((x: any) => x.FolderName == detail.FolderName);
    if (allData) {
      allData.Status = "Invalid";
      allData.ErrorDetail = detail.ErrorDetail;
    }

    this.alertMissingCoversOnce(detail?.FolderName, coverErr.message);
    this.cdr.detectChanges();
    return false;
  }

  saveEalbumInfo(saveInfo: any) {
    debugger;

    // Hard-stop processing if covers are missing (prevents "Success" even if earlier validation was skipped)
    if (!this.ensureMandatoryCoversOrInvalidate(saveInfo)) {
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
    if (saveInfo.EmailAddress != undefined && saveInfo.EmailAddress != ""
      && saveInfo.EmailAddress != null) {
      this.ealbumService.getPhotographerId(saveInfo.EmailAddress.trim())
        .pipe(retryWhen(this.retryWhenOffline(saveInfo)))
        .subscribe((photographerId: any) => {
          if (photographerId > 0) {
            saveInfo.Status = "In Progress";
            addAlbum.AlbumId = 0;
            addAlbum.EventTitle = "";//ctrl.eventname.value;
            addAlbum.CoupleDetail = saveInfo.CoupleName;
            addAlbum.AudioId = this.selectedAudioId;
            if (this.selectedAudioId <= 0) {
              if (this.albums.length > 0) {
                addAlbum.AudioId = this.albums[0].AudioId
              }
            }
            addAlbum.EventDate = eventDate;
            addAlbum.Remark = "";
            addAlbum.EmailAddress = saveInfo.EmailAddress;
            addAlbum.MobileNo = "";
            addAlbum.PageType = saveInfo.PageType;
            addAlbum.PhotographerId = photographerId;

            var allData = this.allfolderDetail.find(x => x.FolderName == saveInfo.FolderName);
            if (allData != undefined) {
              allData.Status = "In Progress";
            }

            this.ealbumService.addLabAlbumDetail(addAlbum)
              .pipe(retryWhen(this.retryWhenOffline(saveInfo)))
              .subscribe((data: any) => {
                saveInfo.EAlbumId = data.ealbumId;
                saveInfo.PhotographerId = photographerId;


                this.ProcessRow(saveInfo, data);

              },
                (error: any) => {
                  if (this.isOfflineError(error)) {
                    // retryWhenOffline will usually handle this, but keep a fallback just in case
                    this.setStatus(saveInfo, 'Waiting', 'Waiting for Internet');
                    return;
                  }
                  this.setStatus(saveInfo, 'Invalid', this.normalizeError(error));

                  if (this.isAllProcess == true) {
                    this.isAllProcess = false;
                    this.ProcessAllImage();
                  }
                })
          }
          else {
            saveInfo.Status = "Invalid";
            saveInfo.ErrorDetail = "Invalid photographer email";

            var allData = this.allfolderDetail.find(x => x.FolderName == saveInfo.FolderName);
            if (allData != undefined) {
              allData.Status = "Invalid";
              allData.ErrorDetail = "Invalid photographer email";
            }

            if (this.isAllProcess == true) {
              this.isAllProcess = false;
              this.ProcessAllImage();
            }
          }
        },
          error => {
            if (this.isOfflineError(error)) {
              this.setStatus(saveInfo, 'Waiting', 'Waiting for Internet');
              return;
            }
            this.setStatus(saveInfo, 'Invalid', this.normalizeError(error));

            if (this.isAllProcess == true) {
              this.isAllProcess = false;
              this.ProcessAllImage();
            }
          })

    }
    else {
      saveInfo.Status = "Invalid";
      saveInfo.ErrorDetail = "email id not found/incorrect";
      var allData = this.allfolderDetail.find(x => x.FolderName == saveInfo.FolderName);
      if (allData != undefined) {
        allData.Status = "Invalid";
        allData.ErrorDetail = "email id not found/incorrect";
      }

      if (this.isAllProcess == true) {
        this.isAllProcess = false;
        this.ProcessAllImage();
      }
    }


  }

  ProcessRow(saveInfo: any, data: any) {
    try {
      const folderPath = saveInfo?.FolderPath;
      if (!folderPath) {
        this.setStatus(saveInfo, 'Invalid', 'Folder path not found');
        if (this.isAllProcess == true) {
          this.isAllProcess = false;
          this.ProcessAllImage();
        }
        return;
      }

      const allFiles = (saveInfo?.FolderImages || []) as any[];
      const imageNodes = allFiles
        .filter(x => x && x.isdirective === false)
        .filter(x => {
          const ext = (this.getExtention(x.name) || '').toString().toLowerCase();
          return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
        })
        .sort((a, b) => (a?.name || '').toString().localeCompare((b?.name || '').toString(), undefined, { numeric: true, sensitivity: 'base' }));

      if (imageNodes.length === 0) {
        this.setStatus(saveInfo, 'Invalid', 'No images found');
        if (this.isAllProcess == true) {
          this.isAllProcess = false;
          this.ProcessAllImage();
        }
        return;
      }

      // Hydrate/repair log.txt so resume can continue from last uploaded image
      const existingLog = this.readLogFile(folderPath) || this.logDetail(imageNodes);
      const logByName = new Map<string, any>();
      existingLog.forEach(x => {
        if (x?.Name) logByName.set(String(x.Name), x);
      });

      const normalizedLog: any[] = imageNodes.map((node) => {
        const name = String(node.name);
        const prev = logByName.get(name);
        return {
          Name: name,
          Status: prev?.Status || 'Open'
        };
      });

      saveInfo.ItemLog = JSON.stringify(normalizedLog);
      this.log(folderPath, normalizedLog);

      this.setStatus(saveInfo, 'In Progress', '');

      const pending = imageNodes
        .map((node, idx) => ({ node, seq: idx + 1 }))
        .filter(t => {
          const entry = normalizedLog.find(x => x.Name === t.node.name);
          return !entry || entry.Status !== 'Done';
        });

      if (pending.length === 0) {
        this.setStatus(saveInfo, 'Done', '');
        if (this.isAllProcess == true) {
          this.isAllProcess = false;
          this.ProcessAllImage();
        }
        return;
      }

      from(pending)
        .pipe(
          concatMap((task) =>
            from(this.fileTreeToFile(task.node)).pipe(
              concatMap((file: File) =>
                this.saveImagesObservable(
                  file,
                  task.seq,
                  saveInfo?.PageType || 'Spread',
                  this.getImageTypeFromName(file.name),
                  saveInfo
                ).pipe(
                  // keep progress events for potential UI hooks, but complete only on HttpResponse
                  filter((event: any) => event instanceof HttpResponse),
                  map((event: any) => event as HttpResponse<any>),
                  tap(() => {
                    const entry = normalizedLog.find(x => x.Name === task.node.name);
                    if (entry) {
                      entry.Status = 'Done';
                    }
                    saveInfo.ItemLog = JSON.stringify(normalizedLog);
                    this.log(folderPath, normalizedLog);
                    const allData = this.allfolderDetail.find(x => x.FolderName == saveInfo.FolderName);
                    if (allData) {
                      allData.ItemLog = saveInfo.ItemLog;
                    }
                    this.cdr.detectChanges();
                  }),
                  retryWhen(this.retryWhenOffline(saveInfo))
                )
              )
            )
          ),
          catchError((err) => {
            // Non-offline errors should mark the folder invalid
            this.setStatus(saveInfo, 'Invalid', this.normalizeError(err));
            return throwError(() => err);
          })
        )
        .subscribe({
          complete: () => {
            this.setStatus(saveInfo, 'Done', '');
            if (this.isAllProcess == true) {
              this.isAllProcess = false;
              this.ProcessAllImage();
            }
          },
          error: () => {
            if (this.isAllProcess == true) {
              this.isAllProcess = false;
              this.ProcessAllImage();
            }
          }
        });
    } catch (err) {
      this.setStatus(saveInfo, 'Invalid', this.normalizeError(err));
      if (this.isAllProcess == true) {
        this.isAllProcess = false;
        this.ProcessAllImage();
      }
    }
  }

  saveImagesObservable(img: File, seq: number, pageType: any, imageType: any, detail: any): Observable<any> {

    const formData: FormData = new FormData();
    formData.append('file', img, img.name);
    formData.append('albumid', detail.EAlbumId.toString());
    formData.append('pagetype', imageType);
    formData.append('viewtype', pageType);
    formData.append('size', this.ealbumService.byteFormat(img.size));
    formData.append('sequenceno', (seq).toString());
    formData.append('uniqid', Date.now().toString());
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
    var logFile = electronFs.createWriteStream(path + '/log.txt', { flags: 'w' });
    // Or 'w' to truncate the file every time the process starts.
    var logStdout = process.stdout;

    setTimeout(() => {
      let detail = util.format.apply(null, arguments);
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
                  fold.ItemLog = JSON.stringify(itemDetail);
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
    this.ealbumService.getAudioDropdown()
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
      this.ealbumService.upload(formData, "api/Mp3/AddAudioWin").subscribe(
        (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            fileDetail.Progress = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            //this.message = event.body.message;      
            this.selectedAudioId = event.body;
            this.getAudioDetail();
          }


        },
        (err: any) => {
        });
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

        var detailsInvalid = JSON.stringify(this.folderDetail);
        this.allfolderDetail = JSON.parse(detailsInvalid);
        return;
      }

      let orderFile = this.getTxtFilePath(fileTree);
      rowDetail.Counter = this.fileCountSingle(fileTree);
      rowDetail.FolderImages = fileTree;
      rowDetail.Status = "Open"
      this.readText(orderFile, detail.FolderName);

      let itemDetail = this.logDetail(fileTree)
      this.readLogText(path, itemDetail, detail.FolderName)

      var details = JSON.stringify(this.folderDetail);
      this.allfolderDetail = JSON.parse(details);
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
