import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, } from '@angular/forms';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateCustomParserFormatter } from 'src/app/config/dateformat';
import { GLOBAL_VARIABLE, IMAGE_TYPE } from 'src/app/config/globalvariable';
import { AddAlbumMetaData } from 'src/app/models/addalbum.metadata';
import { CommonService } from 'src/app/services/common.service';
import { LocalstoreService } from 'src/app/services/localstore.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RoutingService } from 'src/app/services/routing.service';
import { EalbumService } from '../../ealbum.service';

@Component({
  selector: 'app-ealbum-info',
  templateUrl: './ealbum-info.component.html',
  styleUrls: ['./ealbum-info.component.css'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter }
  ]
})
export class EalbumInfoComponent implements OnInit {
  @Input() elabumId: number;
  @Output() saveInfoEvent = new EventEmitter<any>();

  albumForm: FormGroup;
  isPublished: boolean = false;
  addAlbum: AddAlbumMetaData;

  model: NgbDateStruct;
  imageType = IMAGE_TYPE;

  selectedAlbum: number;
  albums: any[] = [];

  viewAlbum: any;
  isClick: boolean = false;
  imageBase64: any;
  base64Size: any;
  base64Name: any;

  logoImg: string = "";

  constructor(
    private fb: FormBuilder,
    private albumService: EalbumService,
    private localStoreService: LocalstoreService,
    private commonService: CommonService,
    private routingService: RoutingService,
    private notificationService: NotificationService
  ) {


    this.albumForm = this.creatForm();
  }

  ngOnInit(): void {
    this.getAudioDetail();

    setTimeout(() => {
      if (this.elabumId > 0) {
        this.getAlbumDetail(this.elabumId);

      }
      else {
        this.logoImg = "../../../../assets/icons/icon-72x72.png"
        let isAllow = this.albumService.isAllowToAddAlbum();
        // if(isAllow == false){
        //   this.notificationService.showError("You do not have permission to allow add album", GLOBAL_VARIABLE.ERROR_MESSAGE_TYPE);
        //   this.routingService.routing('auth/ealbum');
        // }
      }

      let date = new Date();
      this.albumForm.patchValue({
        type: this.imageType[0].Id,
        eventdate: { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
      });
    })
  }

  get f() {
    return this.albumForm.controls;
  }

  creatForm() {
    return this.fb.group({
      // eventname: [, [Validators.required]],
      couplename: [, [Validators.required]],
      // eventdate: [, [Validators.required]],
      type: [, [Validators.required]],
      remark: [],
      audio: [],
      email: [],
      mobile: [],
      logo: []
    });
  }

  saveInfo() {
    let ctrl = this.albumForm.controls;

    if (this.albumForm.valid) {
      if (this.isClick == false) {
        this.isClick = true;

        // let date = ctrl.eventdate.value;
        //let eventDate = new Date(date.year, date.month - 1, date.day);
        this.addAlbum = new AddAlbumMetaData();

        this.addAlbum.AlbumId = this.elabumId;
        this.addAlbum.EventTitle = "";//ctrl.eventname.value;
        this.addAlbum.CoupleDetail = ctrl.couplename.value;
        this.addAlbum.AudioId = ctrl.audio.value;
        this.addAlbum.EventDate = new Date(); //eventDate;
        this.addAlbum.Remark = ctrl.remark.value;
        this.addAlbum.EmailAddress = ctrl.email.value;
        this.addAlbum.MobileNo = ctrl.mobile.value;
        this.addAlbum.PageType = ctrl.type.value;
        this.addAlbum.Base64Logo = this.imageBase64;
        this.addAlbum.LogoName = this.base64Name;

        this.albumService.addAlbumDetail(this.addAlbum)
          .subscribe((data: any) => {
            if (this.elabumId == 0) {
              this.localStoreService.setItem("ealbumId", data);
            }
            let albumDetail = {
              elabumId: data,
              pageViewType: this.addAlbum.PageType
            }
            this.saveInfoEvent.emit(albumDetail);
            this.isClick = false;
          },
            error => {
              this.isClick = false;
            })
      }
    }
  }

  getAudioDetail() {
    this.albumService.getAudioDropdown()
      .subscribe((data: any) => {
        this.albums = data;
        if (this.albums.length > 0 && this.elabumId == 0) {
          let defaultAudio = this.albums.find(x => x.IsDefault == true);
          if (defaultAudio != undefined) {
            this.albumForm.patchValue({
              audio: defaultAudio.AudioId
            });
            this.selectedAlbum = defaultAudio.AudioId;
          }
          else {
            let favoriteAudio = this.albums.find(x => x.IsFavorite == true);
            if (favoriteAudio != undefined) {
              this.albumForm.patchValue({
                audio: favoriteAudio.AudioId
              });
              this.selectedAlbum = favoriteAudio.AudioId;
            }
            else {
              this.albumForm.patchValue({
                audio: this.albums[0].AudioId
              });
              this.selectedAlbum = this.albums[0].AudioId;
            }
          }
        }
      },
        error => {

        });
  }

  getAlbumDetail(id) {
    this.albumService.getAlbumDetailById(id)
      .subscribe((data: any) => {
        this.viewAlbum = data;
        this.patchValue();
      },
        error => {

        })
  }

  patchValue() {
    let eventDate = this.viewAlbum.EventDate;
    this.albumForm.patchValue({
      // eventname: this.viewAlbum.EventTitle,
      type: this.viewAlbum.PageType,
      audio: this.viewAlbum.AudioId,
      couplename: this.viewAlbum.CoupleDetail,
      remark: this.viewAlbum.Remarks,
      email: this.viewAlbum.Email,
      mobile: this.viewAlbum.Mobile
    });
    this.selectedAlbum = this.viewAlbum.AudioId;
    if (eventDate != null) {
      eventDate = new Date(eventDate);
      this.albumForm.patchValue({
        eventdate: { year: eventDate.getFullYear(), month: eventDate.getMonth() + 1, day: eventDate.getDate() }
      });
    }


    let userDetail = JSON.parse(this.localStoreService.getItem(GLOBAL_VARIABLE.LOGIN_DETAIL));
    let logoCreatedImage = "https://api.mobiebook.online/Resources/" + userDetail.UserId + "/" + this.elabumId + "/icons/72x72.png?date=" + new Date();


    let detail = this;
    this.checkImageExists(logoCreatedImage, function (existsImage) {
      if (existsImage == true) {
        detail.logoImg = logoCreatedImage;
      }
    });
  }

  checkImageExists(imageUrl, callBack) {
    var imageData = new Image();
    imageData.onload = function () {
      callBack(true);
    };
    imageData.onerror = function () {
      callBack(false);
    };
    imageData.src = imageUrl;
  }





  attachedFile(event) {

    for (let index = 0; index < event.length; index++) {
      const element = event[index];

      const reader = new FileReader();
      this.commonService.imageToBase64(reader, event[index])
        .subscribe((data) => {
          this.base64Size = event[index].size.toString()
          this.base64Name = event[index].name.toString();
          this.imageBase64 = data;

          this.logoImg = data;
        },
          error => {

          });
    }
  }

}
