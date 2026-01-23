import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ImagesService } from '../images.service';
import { FileTree } from '../model/filetree.metadata';
import { AudioMetaData, FolderDetailMetaData } from '../model/folderdetail.metadata';
import { from, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
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
export class DisplayFolderComponent implements OnInit {
  images: string[] = [];
  directory: any[] = [];

  selectedDirectory: any;
  isDirectiveLoad: boolean = false;
  folderDetail: FolderDetailMetaData[] = [];
  allfolderDetail: FolderDetailMetaData[] = [];
  elabumId: any = 0;
  isAllProcess: boolean = false;
  albums: any[] = [];
  selectedAudioId: any =0;
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
    private excelExport: ExcelExportService
  ) {

    this.statusList.push({ Id: 'ALL', Text: 'All' });
    this.statusList.push({ Id: 'Open', Text: 'Open' });
    this.statusList.push({ Id: 'In Progress', Text: 'In Progress' });
    this.statusList.push({ Id: 'Invalid', Text: 'Failed' });
    this.statusList.push({ Id: 'Done', Text: 'Success' });
  }

  ngOnInit(): void {
    this.getAudioDetail();


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

          if (x.isdirective == false)
            return;

          let row = x;
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
            //this.log(row.path, JSON.stringify(itemDetail));
          }
        })

        let allFolder = JSON.stringify(this.folderDetail);
        this.allfolderDetail = JSON.parse(allFolder);
        //this.allfolderDetail = this.allfolderDetail.filter(x => x.is)
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
      if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg") {
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
        if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg") {
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
        if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg") {
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

    let details = this;
    let processImgCounter = 0;
    let seq = this.changeSequence(imgs);
    let saveImg: any[] = []
    let counter = this.totalFileCount(imgs);
    imgs.forEach(async (row: { name: string | string[]; path: string; SequenceNo: number; }) => {
      let ext = this.getExtention(row.name);
      if (ext.toString().toLowerCase() === ".jpg" || ext.toString().toLowerCase() === ".jpeg") {
        this.getFileObject("file:///" + row.path, row.name, function (fileObject: any) {
          details.attachImage(fileObject, detail.PageType).subscribe((x) => {
            saveImg.push({ url: details.saveImagesObservable(x, row.SequenceNo, details.pageType(x.name), detail.PageType, detail), imgName: row.name })
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
    let processImgCounter = 1;
    from(imageDetail)
      .pipe(
        concatMap((x: any) => x.url)
      ).subscribe((event: any) => {

        if (event.type === HttpEventType.UploadProgress) {
          // imgRow.Progress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          processImgCounter = processImgCounter + 1;
          if (processImgCounter == imageDetail.length) {
            detail.Status = "Done";
            var allData = this.allfolderDetail.find(x => x.FolderName == detail.FolderName);
            if (allData != undefined) {
              allData.Status = "Done";
              this.excelDetail(albumDetail, detail);
            }
            this.updateImageStatus(detail, "DONE");
            if (this.isAllProcess) {
              this.isAllProcess = false;
              this.ProcessAllImage();
            }
          }
        }

      })
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
   
    let imgName = images.map((x: any) => x.name);
    //this.alphaNumericSort(imgName)
    alphaNumericSort(imgName)
    for (let i = 0; i < imgName.length; i++) {
      let row = imgName[i];
      let img = images.find((x: any) => x.name == row);
      if (img != undefined) {
        img.SequenceNo = i + 1;
      }
    }
    let albumDetail = [].slice.call(images).sort((a: any, b: any) => (a.SequenceNo < b.SequenceNo ? -1 : 1));
    // let seq = 1;
    // albumDetail.forEach((x: any) => {
    //   x.SequenceNo = seq
    //   seq = seq + 1;
    // })
    return
  }

  // alphaNumericSort = (arr = []) => {
  //   const sorter = (a: any, b: any) => {
  //     const isNumber = (v: any) => (+v).toString() === v;
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
    let nameLower = name.toLowerCase();
    if (nameLower.search('front') >= 0) {
      if (nameLower.search('tp') >= 0) {
        return "TPFRONT";
      }
      else {
        return "FRONT";
      }
    }
    else if (nameLower.search('back') >= 0) {
      if (nameLower.search('tp') >= 0) {
        return "TPBACK";
      }
      else {
        return "BACK";
      }
    }
    else {
      return "PAGE";
    }
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
    if( this.selectedAudioId <= 0){
      alert("Please choose audio before process");
      return;
    }

    let eventDate = new Date();
    let addAlbum = new AddAlbumMetaData();
    if (saveInfo.EmailAddress != undefined && saveInfo.EmailAddress != ""
      && saveInfo.EmailAddress != null) {
      this.ealbumService.getPhotographerId(saveInfo.EmailAddress.trim())
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
              .subscribe((data: any) => {
                saveInfo.EAlbumId = data.ealbumId;
                saveInfo.PhotographerId = photographerId;


                this.ProcessRow(saveInfo, data);

              },
                (error: any) => {

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

    return this.ealbumService.upload(formData, "api/EAlbum/AcUploadPhotographerImage");

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
        // if (this.albums.length > 0 && this.elabumId == 0) {
        //   let defaultAudio = this.albums.find(x => x.IsDefault == true);
        //   if (defaultAudio != undefined) {
        //     this.selectedAudioId = defaultAudio.AudioId;
        //   }
        //   else {
        //     let favoriteAudio = this.albums.find(x => x.IsFavorite == true);
        //     if (favoriteAudio != undefined) {
        //       this.selectedAudioId = favoriteAudio.AudioId;
        //     }
        //     else {
        //       this.selectedAudioId = this.albums[0].AudioId;
        //     }
        //   }
        // }
      },
        error => {

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
    //alert('Under development');
    let path = detail.FolderPath;
    var fileTree = FileTree.readDir(path);
    let rowDetail = this.folderDetail.find(x => x.FolderName == detail.FolderName);
    if (rowDetail != undefined) {
      let orderFile = this.getTxtFilePath(fileTree);
      rowDetail.Counter = this.fileCountSingle(fileTree);
      rowDetail.FolderImages = fileTree;
      rowDetail.Status = "Open"
      this.readText(orderFile, detail.FolderName);


      let itemDetail = this.logDetail(fileTree)

      this.readLogText(path, itemDetail, detail.FolderName)

      // let displayRow = this.allfolderDetail.find(x => x.FolderName == detail.FolderName);
      // if(displayRow != null){
      //   displayRow = rowDetail;

      // }
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
    if (this.isAllProcess == true) {
      if (confirm("Are you sure you want to cancel?")) {
        this.isCancel = true;
      } else {

      }
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

    if(this.selectedDirectory != null && this.selectedDirectory != undefined){
      this._electronService.shell.openPath(this.selectedDirectory);
    }
    
    //let filePaths = dialog.showOpenDialog(options)
  }

  trimStr(str: any) {
    if(str != undefined){
      if(str.length > 20){
        return str.substring(0,20)+ "...";
      }
      else{
        return str;
      }
    }
    return "";
  }


}
