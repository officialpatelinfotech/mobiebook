export class FolderDetailMetaData {
    FolderName: string | undefined;
    PageType: string | undefined;
    EmailAddress: string | undefined;
    Details: string | undefined;
    FolderTextFile: string | undefined;
    FolderImages: any[] | undefined;
    IsProcess: boolean = false;
    Counter: number = 0;
    CoupleName: string | undefined;
    EAlbumId: number = 0;
    Status: string | undefined;
    ItemLog: string | undefined;
    ErrorDetail: string | undefined;
    FolderPath: string | undefined;
    MobieBookCode: string | undefined;
}


export class AudioMetaData {
    AudioFile: File | undefined;
    FileName: string | undefined;
    Progress: number | undefined;
}