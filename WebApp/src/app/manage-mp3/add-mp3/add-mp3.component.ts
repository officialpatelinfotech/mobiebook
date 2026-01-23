import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Stepper from 'bs-stepper';
import { Observable } from 'rxjs';
import { GLOBAL_VARIABLE } from 'src/app/config/globalvariable';
import { AddMp3ListMetaData, AddMp3Metadata, AudioMetaData } from 'src/app/models/mp3details.metadata';
import { CommonService } from 'src/app/services/common.service';
import { CouponService } from 'src/app/services/coupon.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { Mp3Service } from 'src/app/services/mp3.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';

@Component({
  selector: 'app-add-mp3',
  templateUrl: './add-mp3.component.html',
  styleUrls: ['./add-mp3.component.css']
})
export class AddMp3Component implements OnInit {
  addMpForm : FormGroup
 addMp3Details : AddMp3Metadata;
 userDetails: any;

 
 selectedFiles: FileList;
 currentFile: File;

 progress = 0;
 message = '';
 private stepper: Stepper;

 audioFiles: AudioMetaData[] = [];

 fileInfos: Observable<any>;
 @ViewChild('fileInput', { static: true }) fileCtrl: ElementRef;
 public files: Set<File> = new Set();
 totalAttachFile: number = 0;
 addMp3ListMetaData : AddMp3ListMetaData;

  constructor(
    private routingService: RoutingService,
    private fb: FormBuilder,
    private commonService: CommonService,
    private couponService: CouponService,
    private mp3Service : Mp3Service,
    private notificationService: NotificationService,
    private activeRouter: ActivatedRoute,
    private localStoreService: LocalstoreService,
    private fileUpload: FileUploadService
  ) {
    this.addMp3Details  = new AddMp3Metadata();
    this.addMpForm = this.createForm();
    this.activeRouter.params.subscribe((param: any) => {
     
    });
   
  }

  next() {
    this.stepper.next();
  }
  previous() {
    this.stepper.previous();
  }

  ngOnInit(): void {
    this.userDetails =   JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL))
  }

  createForm(): any {
    return this.fb.group({
      title: [, [Validators.required]],
    });
  }
  
  back(): void {
    this.routingService.routing('auth/manage-mp3');
  }

  get f(){
    return this.addMpForm.controls;
  }

  attachAudioFile(event){
    debugger;
    if(event != null && event != undefined){
      for(let i = 0; i< event.length;i++){
        let aud = new AudioMetaData();
        aud.AudioFile = event[i];
        aud.FileName = event[i].name;
        aud.Progress = 0;
        this.audioFiles.push(aud);
      }
    }
  }

  attachedFile(event) {
    this.addMp3ListMetaData = new  AddMp3ListMetaData;
    this.addMp3ListMetaData.AddMp3MetaData = [];
    for (let index = 0; index < event.length; index++) {
      const element = event[index];
     
        const reader = new FileReader();
        this.commonService.imageToBase64(reader, event[index])
          .subscribe((data) => {
            this.addMp3Details  = new AddMp3Metadata();
            this.addMp3Details.Size = event[index].size.toString();
            this.addMp3Details.FileName = event[index].name.toString();
            this.addMp3Details.Link = data;
            this.addMp3Details.UserId = this.userDetails.UserId;
            this.addMp3Details.Title = event[index].name.toString();
            this.addMp3Details.Description = "";
            this.addMp3Details.Duration = "";
            this.addMp3Details.IsActive = true;
            this.addMp3ListMetaData.AddMp3MetaData.push(this.addMp3Details) //= fileList;
          });

  //    this.files.add(element);
      //this.totalAttachFile = this.totalAttachFile + 1;
    }
    //this.addMp3ListMetaData.AddMp3MetaData = fileList;
  }

  uploadFile() {
    this.progress = 0;

    this.currentFile = this.selectedFiles.item(0);
    
    this.fileUpload.upload(this.currentFile,"").subscribe(
      event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          this.message = event.body.message;
          this.fileInfos = this.fileUpload.getFiles();
        }
      },
      err => {
        this.progress = 0;
        this.message = 'Could not upload the file!';
        this.currentFile = undefined;
      });
    this.selectedFiles = undefined;
  }

  selectFile(event): void {
    this.selectedFiles = event.target.files;
  }




  
  addMp3Detail(): void {
    for(let i =0; i <this.audioFiles.length; i++){
      let fileDetail = this.audioFiles[i];
      const formData: FormData = new FormData();
      formData.append('file', fileDetail.AudioFile,  fileDetail.AudioFile.name);
      this.fileUpload.upload(formData,"api/Mp3/AddAudio").subscribe(
        event => {
          if (event.type === HttpEventType.UploadProgress) {
            fileDetail.Progress = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            //this.message = event.body.message;      
            if(i == this.audioFiles.length -1){
              this.back();
            }      
          }

          
        },
        err => {
          this.progress = 0;
          this.message = 'Could not upload the file!';
          this.currentFile = undefined;
        });
    }
      // this.mp3Service.addMp3(this.addMp3ListMetaData)
      //   .subscribe((data: any) => {
      //       this.notificationService.showSuccess(GLOBAL_VARIABLE.COUPON_ADDEDD,GLOBAL_VARIABLE.SUCCESS_MSG_TYPE)
      //       this.back();
      //     },
      //     error => {           
      //       this.notificationService.showError(error,GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE)
      //     });
  }
}
