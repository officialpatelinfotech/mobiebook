import { Injectable } from '@angular/core';
import { resolve } from 'dns';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';


@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

 trimData(title: any){
  if(title != undefined && title != null && title != ""){
    return title.trim();
  }
  else{
    return "";
  }
 }

  exportExcel(data: any[],electronFs: any,path: any) {
 debugger;
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet('ProductSheet');
   
    worksheet.columns = [
      { header: 'Project Name', key: 'projectname', width: 10 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Mobile No', key: 'mobile', width: 32 },
      { header: 'Photographer Name', key: 'photographername', width: 10 },
      { header: 'Total Photo', key: 'totalphoto', width: 10 },
      { header: "Ealbum No", key:'ealbumcode',width:10},
      { header: 'Status', key: 'status', width: 10, style: { font: { name: 'Arial Black', size:10} } },
    ];
   
    data.forEach((e: any) => {
      worksheet.addRow({projectname: this.trimData(e.projectname),email: this.trimData(e.email),
        mobile: this.trimData(e.mobileno) , photographername: this.trimData(e.photographername),
        totalphoto:e.totalphoto - 2, ealbumcode: this.trimData(e.ealbumcode),status:e.status },"n");
    });
   
    workbook.xlsx.writeBuffer().then((data: any) => {
      electronFs.writeFile(path+"/mobiebook.xlsx", data,  { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
       function(err:any) {
        if (err) {
          console.log(err);
      } else {
          console.log("JSON saved");         
      }
    });

     // let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
     // fs.saveAs(blob, 'ProductData.xlsx');

     // electronFs.createWriteStream('ProductData.xlsx').write(blob)
    //  var reader = new FileReader();
    //  reader.readAsDataURL(blob); 
    //  reader.onloadend = function() {
    //      var base64data = reader.result;                
    //       electronFs.writeFile(path+'/ProductData.xlsx',base64data,function(error:any) {
    //       console.log("file create");
    //     });
    //  }
      
    })
   
  }
}
function reject(err: any) {
  throw new Error('Function not implemented.');
}

