export class Utilities{

    public static isString(x: any): x is string{
        return typeof x === 'string';
    }

    public static isNumber(x: any): x is number{
        return typeof x === 'number';
    }

    public static isArray(x: any): x is string[]{
        if (x instanceof Array){
            return true;
        }
        else {
            return false;
        }
    }

    public static getUniqId(): string{
      return  Math.random().toString(36).substr(2, 9);
    }

    public static  makeStringArray(val): string[]{
        return  val.split(',');
    }

    public static commonSeparatedStr(val): string{
        let valStr = '';
        if (val.length > 0){
            valStr = val.join(', ');
        }
        return valStr;
    }

    public static stringLenghtLimit(val: any,strLenght: number = 5): string{
        if(val != null && val != undefined){
            if(val.length > strLenght){
                return val.substring(0,strLenght) + '...';
            }
            else{
                return val;
            }
            
        }
        return "";
    }
}
