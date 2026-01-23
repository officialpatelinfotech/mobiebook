import { HttpEventType, HttpParams, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import Stepper from 'bs-stepper';
import { Observable } from 'rxjs';
import { GLOBAL_VARIABLE, IMAGE_TYPE, IMG_TYPE, PageViewType } from 'src/app/config/globalvariable';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { RoutingService } from 'src/app/services/routing.service';
import Compressor from 'compressorjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EalbumService } from '../ealbum.service';
import { CouponDetailModule } from 'src/app/coupon-detail/coupon-detail.module';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateCustomParserFormatter } from 'src/app/config/dateformat';
import { AddAlbumMetaData, AlbumImage } from 'src/app/models/addalbum.metadata';
import { ViewAlbumMetaData } from 'src/app/models/viewalbum.metadata';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfimationService } from 'src/app/shared/confimation.service';
import { NotificationService } from 'src/app/services/notification.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { DOCUMENT } from '@angular/common';

declare var $: any;

@Component({
  selector: 'app-add-ealbum',
  templateUrl: './add-ealbum.component.html',
  styleUrls: ['./add-ealbum.component.css'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter }
  ]
})
export class AddEalbumComponent implements OnInit {
  serverLink = GLOBAL_VARIABLE.SERVER_LINK + "Resources/";
  model: NgbDateStruct;
  selectedFiles: FileList;
  currentFile: File;
  progress = 0;
  message = '';
  private stepper: Stepper;
  
  imageType = IMAGE_TYPE;
  albumId: number = 0;



  albumImages: AlbumImage[] = [];
  albumImageFront: AlbumImage[] = [];
  albumImageBack: AlbumImage[] = [];
  viewAlbum: ViewAlbumMetaData;
  addAlbum: AddAlbumMetaData;
  
  popUpEalbum: boolean = false;

  fileInfos: Observable<any>;

  public files: Set<File> = new Set();
  public frontFiles: Set<File> = new Set();
  totalAttachFile: number = 0;
  rows: any[] = [];

  pageType = PageViewType;

  selectedAlbum: number;
  albums: any[] = [];
  albumPages: any[] = [];
  currentStep: any;
  isImgLoad: boolean = false;

  pageUploadType: any;

  constructor(
    private routingService: RoutingService,
    private fileUpload: FileUploadService,
    private fb: FormBuilder,
    private albumService: EalbumService,
    private activeRouter: ActivatedRoute,
    private router: Router,
    private confirmDialogService: ConfimationService,
    private notificationService: NotificationService,
    private localStoreService: LocalstoreService,
    @Inject(DOCUMENT) private document: Document
  ) {
    
    
  }

  next() {
    this.loadNextStep();

  }
  previous() {
    this.loadPreviousStep();
  }

  onSubmit() {
    return false;
  }

  ngOnInit(): void {

    this.fileInfos = this.fileUpload.getFiles();
    this.stepper = new Stepper(document.querySelector('#stepper1'), {
      linear: false,
      animation: true
    });

    this.activeRouter.params.subscribe((param: any) => {

      // tslint:disable-next-line: triple-equals
      if (param.id != undefined) {
        this.albumId = +param.id;        
      }
      else {
        this.isImgLoad = true;
        let albumIdDetail = this.localStoreService.getItem("ealbumId");
        if (albumIdDetail != undefined && albumIdDetail != null) {
          this.albumId = parseInt(albumIdDetail);         
        }      

      }
    });

    if (this.activeRouter.snapshot.queryParams.step != undefined) {
      let step = +this.activeRouter.snapshot.queryParams.step;

      this.moveStepper(step);
    }

  }

  displayImage(file: File) {
    let url = URL.createObjectURL(file);
    return url;
  }

  selectFile(event): void {
    this.selectedFiles = event.target.files;
  }

  backAlbum() {
    this.routingService.routing("auth/ealbum");
  }

  saveInfoEvent(elabumDetail) {
    debugger;
    if (this.albumId == 0) {
      this.albumId = elabumDetail.elabumId;
    }
    this.pageUploadType = elabumDetail.pageViewType;
    this.loadNextStep();
  }

  saveCover(elabumDetail) {
    if (elabumDetail.moveto == GLOBAL_VARIABLE.PREVIOUS) {
      this.loadPreviousStep();
    }
    else {
      this.loadNextStep();
    }

  }

  savePages(elabumDetail) {
    if (elabumDetail.moveto == GLOBAL_VARIABLE.PREVIOUS) {
      this.loadPreviousStep();      
    }
    else {
      this.loadNextStep();
    }
  }

  savePublish(elabumDetail) {
    if (elabumDetail.moveto == GLOBAL_VARIABLE.PREVIOUS) {
      this.loadPreviousStep();      
    }
    else {
      this.loadNextStep();
    }
  }



  closeEalbumPopup() {
    this.popUpEalbum = false;
  }

  processToStep(step) {
    let mainUrl = this.router.url;
    if (mainUrl == undefined)
      return;

    let sp = mainUrl.split('?');
    this.routingService.routingQuery(sp[0], { step: (step).toString() });

  }

  loadNextStep() {
    let nextStp = this.getNextStepId();
    this.moveStepper(nextStp);
    this.processToStep(nextStp);
  }

  loadPreviousStep() {
    let preStp = this.getPreviousStepId()
    this.moveStepper(preStp);
    this.processToStep(preStp);
  }

  moveStepper(step) {
    this.currentStep = step;
    this.stepper.to(step);
  }

  getCurrentStep() {
    if (this.activeRouter.snapshot.queryParams.step != undefined) {
      return +this.activeRouter.snapshot.queryParams.step;
    }
    else {
      return 1;
    }
  }

  getNextStepId() {
    let currentStep = this.getCurrentStep();
    return currentStep + 1;
  }

  getPreviousStepId() {
    let currentStep = this.getCurrentStep();
    return currentStep - 1;
  }

  getPageStep(pageStep){
    debugger;
    if( this.albumId > 0){
      this.moveStepper(pageStep);
      this.processToStep(pageStep);
    }
    
  }
  

}
