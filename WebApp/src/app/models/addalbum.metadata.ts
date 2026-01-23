export class AddAlbumMetaData {
    AlbumId: number;
    EventTitle: string;
    CoupleDetail: string;
    AudioId: number;
    EventDate: Date;
    Remark: string;
    EmailAddress: string;
    MobileNo:string;
    PageType: string;
    LogoName: string;
    Base64Logo: string;
}

export class AlbumImage {    
    FileDetail: File;
    Progress: number;
    SequenceNo: number;
    Title: string;
    ImageLink: string;
    PageType: string;
    PageViewType:string;   
    ImageSize:string;
    ImageTitle: string;
    AlbumPageId: number;
    AlbumId: number;
    UniqId: string;
    ParentId: string;
    IsAlbumView: boolean; 
}