/**
 * FILE MODULE
 * ===========
 * Equivalent to Logger1.cs
 */


//the export statement is file module entry point
//it allows import by filename
//line below allows: import { Logger1 } from "./logger1";
//so, if we change the file name, or the module (folder) name,//the import statement will break

export class Logger1 {
    log(message: string) {
      console.log(`[Logger3] ${message}`);
    }
  }
  