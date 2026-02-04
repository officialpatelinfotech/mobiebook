import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ImagesService } from '../images.service';
import { FileTree } from '../model/filetree.metadata';
import { AudioMetaData, FolderDetailMetaData } from '../model/folderdetail.metadata';
import { from, fromEvent, interval, merge, Observable, of, throwError } from 'rxjs';
import { concatMap, map, mapTo, filter, take, retryWhen } from 'rxjs/operators';
import { AddAlbumMetaData } from '../model/addalbum.metadata';
import { EalbumService } from '../services/ealbum.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { IMG_TYPE } from '../config/globalvariable';
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

  private activeFolderForInternet: any;
  private readonly onOnline = () => {
    try {
      if (this.activeFolderForInternet && this.activeFolderForInternet.Status === 'Waiting for Internet') {
        this.setFolderStatus(this.activeFolderForInternet, 'In Progress');
        this.cdr.detectChanges();
      }
    } catch (e) {
      // no-op
    }
  };

  private readonly onOffline = () => {
    try {
      if (this.activeFolderForInternet && this.activeFolderForInternet.Status !== 'Done') {
        this.setFolderStatus(this.activeFolderForInternet, 'Waiting for Internet');
        this.cdr.detectChanges();
      }
    } catch (e) {
      // no-op
    }
  };

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
    this.statusList.push({ Id: 'Waiting for Internet', Text: 'Waiting for Internet' });
    this.statusList.push({ Id: 'Invalid', Text: 'Failed' });
    this.statusList.push({ Id: 'Done', Text: 'Success' });
  }

  ngOnInit(): void {
    try {
      window.addEventListener('online', this.onOnline);
      window.addEventListener('offline', this.onOffline);
    } catch (e) {
      // no-op
    }
    this.getAudioDetail();
  }

  ngOnDestroy() {
    if (this.currentWatcher) {
      this.currentWatcher.close();
    }
    try {
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
    } catch (e) {
      // no-op
    }
  }

  private setFolderStatus(folder: any, status: string) {
    if (!folder) return;
    folder.Status = status;
    const tableRow = this.allfolderDetail?.find((x: any) => x.FolderName == folder.FolderName);
    if (tableRow) {
      tableRow.Status = status;
    }
  }

  private isInternetAvailableNow(): boolean {
    // Rule: use navigator.onLine as first signal
    try {
      return navigator.onLine === true;
    } catch (e) {
      return true;
    }
  }

  private waitForInternet$(folder?: any): Observable<void> {
    if (this.isInternetAvailableNow()) {
      return of(void 0);
    }

    // Pause immediately and show status
    if (folder) {
      this.activeFolderForInternet = folder;
      this.setFolderStatus(folder, 'Waiting for Internet');
      this.cdr.detectChanges();
    }

    // Keep checking every 3 seconds + also listen to 'online' event
    return merge(
      fromEvent(window, 'online').pipe(take(1), mapTo(void 0)),
      interval(3000).pipe(
        filter(() => this.isInternetAvailableNow()),
        take(1),
        mapTo(void 0)
      )
    ).pipe(
      map(() => {
        if (folder) {
          this.setFolderStatus(folder, 'In Progress');
          this.cdr.detectChanges();
        }
        return void 0;
      })
    );
  }

  private isOfflineError(err: any): boolean {
    // If OS/browser says offline, treat any error as offline-related
    if (!this.isInternetAvailableNow()) return true;
    // Angular HttpClient commonly uses status 0 for network problems
    if (err && typeof err.status === 'number' && err.status === 0) return true;
    return false;
  }

  private runWhenOnlineWithRetry<T>(folder: any, makeCall: () => Observable<T>): Observable<T> {
    return this.waitForInternet$(folder).pipe(
      concatMap(() =>
        makeCall().pipe(
          retryWhen((errors: any) =>
            errors.pipe(
              concatMap((err: any) => {
                if (this.isOfflineError(err)) {
                  return this.waitForInternet$(folder);
                }
                console.error('API Error FULL:', err);
                console.error('Status:', err?.status);
                console.error('Message:', err?.error);
                alert(err?.error?.message || err?.message || 'Internal Server Error');
                return throwError(() => err);
              })
            )
          )
        )
      )
    );
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
    try {
      console.log('Checking for new folders in:', path);
      let files = FileTree.readDir(path);
      let currentFolderNames = this.folderDetail.map(x => x.FolderName);
      let hasChanges = false;

      files.forEach((row: any) => {
        if (row.isdirective) {
          if (!currentFolderNames.includes(row.name)) {
            console.log('Found new folder:', row.name);
            this.processSingleFolder(row);
            hasChanges = true;
          } else {
            // Update existing folder content
            let existingFolder = this.folderDetail.find(x => x.FolderName == row.name);
            if (existingFolder) {
              let newCount = this.fileCount(row);
              if (existingFolder.FolderImages && (existingFolder.Counter !== newCount || existingFolder.FolderImages.length !== row.items.length)) {
                console.log('Updating existing folder:', row.name);
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
    } catch (err) {
      console.error('Error in checkForNewFolders:', err);
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
      alert(`Folder '${row.name}' Invalid: Order file not found (needs .txt file)`); // Added Debug Alert
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


  async ProcessAllImage() {
    this.isAllProcess = true; // Set loading state immediately

    if (!navigator.onLine || !(await this.checkInternet())) {
      alert("Internet connection is compulsory for processing.");
      this.isAllProcess = false;
      return;
    }

    if (this.selectedAudioId > 0) {
      if (this.isCancel == false) {

        // Skip any "Open" folder that fails validations
        let row = this.folderDetail.find(x => x.Status == "Open");
        while (row && (!this.ensureMandatoryCoversOrInvalidate(row) || !this.validateFolderConstraints(row))) {
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
        this.isAllProcess = false;
      }
    }
    else {
      alert("Please choose audio before process");
      this.isAllProcess = false;
    }
  }

  async checkInternet(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const https = remote.require('https');
        const req = https.get('https://www.google.com', { timeout: 5000 }, (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true); // Connected
          } else {
            // Redirects (3xx) are technically connected, 4xx/5xx means server reached
            resolve(true);
          }
        });

        req.on('error', (e: any) => {
          console.error("Internet Check Request Failed:", e);
          resolve(false);
        });

        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });

        req.end();
      } catch (e) {
        console.error("Remote HTTPS check failed:", e);
        resolve(false);
      }
    });
  }

  // New validation method
  validateFolderConstraints(detail: any): boolean {
    // 1. Check Max 72 Spreads
    // Count: Inner Spreads (jpg/png) exclude Covers (Front/Back)
    // TPs and Emboss are counted as 1 spread each.
    // Inner images (Spread mode) = 1 spread each.

    let spreadCount = 0;
    const images = detail.FolderImages || [];

    for (const img of images) {
      if (!img.name) continue;
      const nameLower = img.name.toLowerCase();

      // Exclude Covers from spread count
      if (/(^|[_\s-])(front[\s_-]?cover|c1)(?=\.)/i.test(nameLower) ||
        /(^|[_\s-])(back[\s_-]?cover|c2)(?=\.)/i.test(nameLower)) {
        continue;
      }

      // Count TPs, Emboss, and Inner Spreads
      // Assuming all other valid images are spreads/pages
      let ext = this.getExtention(img.name);
      if (ext) {
        let extStr = ext.toString().toLowerCase();
        if (extStr === ".jpg" || extStr === ".jpeg" || extStr === ".png") {
          spreadCount++;
        }
      }
    }

    if (spreadCount > 72) {
      detail.Status = "Invalid";
      detail.ErrorDetail = `Max 72 spreads allowed (Found: ${spreadCount})`;

      const allData = this.allfolderDetail?.find((x: any) => x.FolderName == detail.FolderName);
      if (allData) {
        allData.Status = "Invalid";
        allData.ErrorDetail = detail.ErrorDetail;
      }
      this.cdr.detectChanges();
      return false;
    }

    // 2. Check Even Pages (if PageType is 'Page')
    // Currently PageType seems hardcoded to 'Spread', but adding logic for future/correctness
    if (detail.PageType === 'Page') {
      const insidePages = spreadCount; // Start with total valid images (excluding covers)
      // If TPs/Emboss are considered "Special" and not "Inside Pages" for parity check, 
      // we might need to filter them out. Assuming "inside pages" means all content pages.

      if (insidePages % 2 !== 0) {
        detail.Status = "Invalid";
        detail.ErrorDetail = `Inside pages count must be even (Found: ${insidePages})`;

        const allData = this.allfolderDetail?.find((x: any) => x.FolderName == detail.FolderName);
        if (allData) {
          allData.Status = "Invalid";
          allData.ErrorDetail = detail.ErrorDetail;
        }
        this.cdr.detectChanges();
        return false;
      }
    }

    return true;
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

    // Track active folder for immediate offline status updates
    this.activeFolderForInternet = saveInfo;

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

      this.setFolderStatus(saveInfo, 'In Progress');

      this.runWhenOnlineWithRetry(saveInfo, () => this.ealbumService.getPhotographerId(saveInfo.EmailAddress.trim()))
        .pipe(
          concatMap((photographerId: any) => {
            if (!(photographerId > 0)) {
              return throwError(() => ({ message: 'Invalid photographer email', _kind: 'validation' }));
            }

            addAlbum.AlbumId = 0;
            addAlbum.EventTitle = "";
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

            return this.runWhenOnlineWithRetry(saveInfo, () => this.ealbumService.addLabAlbumDetail(addAlbum))
              .pipe(map((data: any) => ({ data, photographerId })));
          })
        )
        .subscribe(
          (res: any) => {
            saveInfo.EAlbumId = res.data.ealbumId;
            saveInfo.PhotographerId = res.photographerId;
            this.ProcessRow(saveInfo, res.data);
          },
          (error: any) => {
            if (error?._kind === 'validation' || error?.message === 'Invalid photographer email') {
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
              return;
            }

            // Any other error (server etc.) remains a failure
            console.error("API Error:", error);
            saveInfo.Status = "Invalid";
            saveInfo.ErrorDetail = error?.message || "Server Error";
            this.isAllProcess = false;
            this.cdr.detectChanges();
          }
        );

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
    this.activeFolderForInternet = saveInfo;
    let images = saveInfo.FolderImages;
    let validImages: any[] = [];

    for (let i = 0; i < images.length; i++) {
      let row = images[i];
      let ext = this.getExtention(row.name);
      if (ext) {
        let extStr = ext.toString().toLowerCase();
        if (extStr === ".jpg" || extStr === ".jpeg" || extStr === ".png") {
          validImages.push(row);
        }
      }
    }

    if (typeof alphaNumericSort !== 'undefined') {
      try {
        validImages.sort((a, b) => alphaNumericSort(a.name, b.name));
      } catch (e) {
        validImages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      }
    } else {
      validImages.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }

    from(validImages).pipe(
      concatMap((item: any, index: number) => {
        if (this.isCancel) {
          throw new Error("Cancelled");
        }

        const seq = index + 1;

        // Gate + retry on offline errors; do not advance index until current upload succeeds.
        return this.waitForInternet$(saveInfo).pipe(
          concatMap(() => {
            let buffer = electronFs.readFileSync(item.path);
            let file = new File([buffer], item.name, { type: 'image/jpeg' });

        let pageType = "Spread";
        let nameLower = item.name.toLowerCase();

        if (/(^|[_\s-])(front[\s_-]?cover|c1)(?=\.)/i.test(nameLower)) {
          pageType = "FRONT";
        }
        else if (/(^|[_\s-])(back[\s_-]?cover|c2)(?=\.)/i.test(nameLower)) {
          pageType = "BACK";
        }
        else if (nameLower.includes("front tp")) {
          pageType = "TPFRONT";
        }
        else if (nameLower.includes("back tp")) {
          pageType = "TPBACK";
        }
        else if (nameLower.includes("emboss")) {
          pageType = "EMBOSS";
        }

            return this.saveImagesObservable(file, seq, pageType, pageType, saveInfo);
          }),
          retryWhen((errors: any) =>
            errors.pipe(
              concatMap((err: any) => {
                if (this.isOfflineError(err)) {
                  return this.waitForInternet$(saveInfo);
                }
                console.error('API Error FULL:', err);
                console.error('Status:', err?.status);
                console.error('Message:', err?.error);
                alert(err?.error?.message || err?.message || 'Internal Server Error');
                return throwError(() => err);
              })
            )
          )
        );
      })
    ).subscribe(
      (res: any) => {
        // Optional: Update progress here if needed
      },
      (err: any) => {
        console.error(err);

        if (err?.message !== "Cancelled") {
          saveInfo.Status = "Invalid";
          saveInfo.ErrorDetail = err?.message || "Image upload failed";
        }

        this.isAllProcess = false;
        this.cdr.detectChanges();
      },
      () => {
        if (!this.isCancel) {
          saveInfo.Status = "Done";
          this.cdr.detectChanges();
          if (this.isAllProcess) {
            this.ProcessAllImage();
          }
        }
      }
    );
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

    // Ensure upload is internet-aware and resumes automatically after offline.
    return this.runWhenOnlineWithRetry(detail, () => this.ealbumService.upload(formData, "api/EAlbum/AcUploadPhotographerImage"));

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
    const logPath = path + '/log.txt';
    // Log size limit (future safe): if log grows beyond 5MB, delete it.
    try {
      if (electronFs.existsSync(logPath)) {
        const sizeMB = electronFs.statSync(logPath).size / (1024 * 1024);
        if (sizeMB > 5) electronFs.unlinkSync(logPath);
      }
    } catch (e) {
      // no-op
    }

    var logFile = electronFs.createWriteStream(logPath, { flags: 'w' });
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


  getMissingCoverError(files: any[], folderName: string): { message: string } | null {
    let hasFront = false;
    let hasBack = false;

    // STRICT matching → prevents C12 / C21 false positives
    const frontRegex = /(^|[_\s-])(front[\s_-]?cover|c1)(?=\.)/i;
    const backRegex = /(^|[_\s-])(back[\s_-]?cover|c2)(?=\.)/i;

    if (!Array.isArray(files)) return null;

    for (const f of files) {
      const name = (f?.name || '').toLowerCase();
      if (frontRegex.test(name)) hasFront = true;
      if (backRegex.test(name)) hasBack = true;
    }

    if (!hasFront && !hasBack)
      return { message: "Front Cover and Back Cover are mandatory" };

    if (!hasFront)
      return { message: "Front Cover is mandatory" };

    if (!hasBack)
      return { message: "Back Cover is mandatory" };

    return null;
  }

  alertMissingCoversOnce(folderName: string, message: string) {
    if (this.coverAlertShownForFolder.has(folderName)) {
      return;
    }
    this.coverAlertShownForFolder.add(folderName);
    alert(message);
  }

}  