
export class AddMp3Metadata
{
     Mp3Id : number 
     Title : string
     Size : string
     Duration : string
     FileName : string
     Link : string
     Description : string
     IsActive : boolean;
     UserId : number
}

export class AddMp3ListMetaData
    {
         AddMp3MetaData : AddMp3Metadata[];
    }

export class FavourateMp3Metadata
{
     Mp3Id : number
     UserId : number
     IsActive : boolean;
}

export class AudioMetaData {
     AudioFile: File;
     FileName: string;
     Progress:number;
}