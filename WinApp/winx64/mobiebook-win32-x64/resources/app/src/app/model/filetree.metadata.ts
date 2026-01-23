const electron = (<any>window).require('electron');
var remote = electron.remote;
var electronFs = remote.require('fs');

export class FileTree {

    build = () => {
        this.items = FileTree.readDir(this.path);
    }

    isImageFolder(path:any){
        let mainImgFolder = true;
        let fileDetail = electronFs.readdirSync(path);
        fileDetail.forEach((file: null | undefined) => {
            var fileInfo = new FileTree(`${path}\\${file}`, file);
            var stat = electronFs.statSync(fileInfo.path);
            if (stat.isDirectory()){
                mainImgFolder = false;
            }
        });
        
        return mainImgFolder;
    }

    static readDir(path: any) {
        var fileArray: FileTree[] = [];

        let fileDetail = electronFs.readdirSync(path);
        fileDetail.forEach((file: null | undefined) => {
            var fileInfo = new FileTree(`${path}\\${file}`, file);

            var stat = electronFs.statSync(fileInfo.path);

            if (stat.isDirectory()){
                fileInfo.isdirective = true;
                fileInfo.items = FileTree.readDir(fileInfo.path);               
            }
            else{
                fileInfo.isdirective = false;
            }

            fileArray.push(fileInfo);
        })

        return fileArray;
    }
    constructor(path: any, name = null){
        this.path = path;
        this.name = name;
        this.items = [];
    }

    path:any;
    name: any;
    items: any[];
    isdirective: boolean | undefined;

}