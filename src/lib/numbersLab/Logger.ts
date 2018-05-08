/*
 * Copyright 2018 NumbersLab - https://github.com/NumbersLab
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {Context} from "./Context";

export class Logger{
    public static  EMERGENCY = 700;
    public static  ALERT     = 600;
    public static  CRITICAL  = 500;
    public static  ERROR     = 400;
    public static  WARNING   = 300;
    public static  NOTICE    = 200;
    public static  INFO      = 100;
    public static  DEBUG     = 0;

    public static LEVEL_NAMES:any = {
        '700':'EMERGENCY',
        '600':'ALERT',
        '500':'CRITICAL',
        '400':'ERROR',
        '300':'WARNING',
        '200':'NOTICE',
        '100':'INFO',
        '0':'DEBUG',
    };

    static set level(level : number){
        // console.log('Setting logger level to '+level);
        Context.getGlobalContextStorage().logLevel = level;
    }
    static get level() : number{
        let level = Context.getGlobalContextStorage().logLevel;
        return level;
    }

    public static log(level : number, caller: string, message : string, context : any = {}){
        if(Logger.level <= level){
            let levelName = Logger.LEVEL_NAMES[level] === null ? '????' : Logger.LEVEL_NAMES[level];
            if(level >= Logger.ERROR) {
                console.error(levelName + '[' + Logger.getCallerName(caller) + ']' + Logger.interpolate(message, context));
            }
            else if(level >= Logger.WARNING)
                console.warn(levelName+'['+Logger.getCallerName(caller)+']'+Logger.interpolate(message, context));
            else{
				console.log(levelName+'['+Logger.getCallerName(caller)+']'+Logger.interpolate(message, context));
            }

        }
    }

    public static debug(caller: any, message : string, context : any = {}){
        Logger.log(Logger.DEBUG, caller, message, context);
    }
    public static info(caller: any, message : string, context : any = {}){
        Logger.log(Logger.INFO, caller, message, context);
    }
    public static notice(caller: any, message : string, context : any = {}){
        Logger.log(Logger.NOTICE, caller, message, context);
    }
    public static warning(caller: any, message : string, context : any = {}){
        Logger.log(Logger.WARNING, caller, message, context);
    }
    public static error(caller: any, message : string, context : any = {}){
        Logger.log(Logger.ERROR, caller, message, context);
    }
    public static critical(caller: any, message : string, context : any = {}){
        Logger.log(Logger.CRITICAL, caller, message, context);
    }
    public static alert(caller: any, message : string, context : any = {}){
        Logger.log(Logger.ALERT, caller, message, context);
    }
    public static emergency(caller: any, message : string, context : any = {}){
        Logger.log(Logger.EMERGENCY, caller, message, context);
    }

    private static interpolate(message:string, context : any = {}){
        for(let key in context) {
            message = message.replace('{' +key+ '}', context[key]);
        }
        return message;
    }

    private static getCallerName(object : any){
        let type = typeof object;
        if(type === 'string'){
            return object;
        }else if(type === 'object'){
            let funcNameRegex = /function (.{1,})\(/;
            let results = (funcNameRegex).exec((object).constructor.toString());
            let name = (results && results.length > 1) ? results[1] : '';
            if(name !== '')
                return name;
            funcNameRegex = /class [a-zA-Z0-9]+/;
            results = (funcNameRegex).exec((object).constructor.toString());
            return (results && results.length == 1) ? results[0].replace('class ', '') : '????';
        }
        return object;
    }

}

Logger.level = Logger.WARNING;
