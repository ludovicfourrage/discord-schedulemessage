import * as xlsx from "xlsx";


export function saveToExcel(json2sheets: {name: string, data: Array<unknown>}[], filename:string, overwritesheet:boolean, overwritefile:boolean) {
    let workbook: xlsx.WorkBook;
    const sheets = json2sheets.map((json2sheet) => ({name: json2sheet.name, sheetdata: xlsx.utils.json_to_sheet(json2sheet.data)}));
    if (overwritefile) {
      workbook = xlsx.utils.book_new();
    } else {
      try {
        workbook = xlsx.readFile(filename);
      } catch {
        workbook = xlsx.utils.book_new();
      }
    }
  
    sheets.forEach((sheet) => {
      if (overwritesheet && workbook.SheetNames.indexOf(sheet.name) !== -1) {
        workbook.Sheets[sheet.name] = sheet.sheetdata;
      } else {
        xlsx.utils.book_append_sheet(workbook, sheet.sheetdata, sheet.name);
      }
    });
    xlsx.writeFile(workbook, filename);
  }
  
  export function loadFromXLSX(filepath:string, sheet:number, options:xlsx.ParsingOptions | undefined, loadOptions?:xlsx.ParsingOptions | undefined) {
    const lxlsx = xlsx.readFile(filepath, loadOptions);
    if (isNaN(sheet)) {
      return xlsx.utils.sheet_to_json(lxlsx.Sheets[sheet], options);
    } else {
      return xlsx.utils.sheet_to_json(lxlsx.Sheets[lxlsx.SheetNames[sheet - 1]], options);
    }
  }