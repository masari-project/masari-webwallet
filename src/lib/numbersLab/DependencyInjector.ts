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

export class DependencyInjector{

    static debug = true;

    values:any = {};

    getInstance(name:string, subname:string='default', createIfPossible:boolean=true):any{
        if(typeof this.values[name+'-'+subname] != 'undefined')
            return this.values[name+'-'+subname];
        if(createIfPossible)
            return this.returnBest(name, subname);
        return null;
    }

    register(name:string, object:any, subname:string='default'):any{
        this.values[name+'-'+subname] = object;
    }

    returnBest(name:string, subname:string):any{
        let found : any = this.searchFromRequireJs(name);
        console.log(name, subname,found);
        if(found != null){
            this.register(name, new found(), subname);
        }
        return this.getInstance(name, subname, false);
    }

    searchFromRequireJs(name:string){
        //noinspection TypeScriptUnresolvedVariable
        let loaded = (<any>window).require.s.contexts._.defined;
        let dependency = null;

        console.log(loaded);

        for(let containerName in loaded){
            let container = loaded[containerName];
            // console.log('type', typeof container, container, container[name]);
            if(typeof container[name] != 'undefined') {
                if(!DependencyInjector.debug)
                    return container[name];
                else{
                    if(dependency != null){
                        console.log('%c/!\\ Dependency injector : Multiple Classes Have the same name !! Conflict when resolving dependencies', 'background: white;color: red');
                    }
                }
                dependency = container[name];
            }else{
				// console.log('default->', typeof container['default']);
				if(
					typeof container['default'] === 'function' ||
					typeof container['default'] === 'object'
				){
            		if(container['default'].name === name){
						if(!DependencyInjector.debug)
							return container['default'];
						else{
							if(dependency != null){
								console.log('%c/!\\ Dependency injector : Multiple Classes Have the same name !! Conflict when resolving dependencies', 'background: white;color: red');
							}
						}
						dependency = container['default'];
					}
				}
			}
        }
        return dependency;
    }

}

export function DependencyInjectorInstance() : DependencyInjector{
	if(
		typeof Context.getGlobalContext()['di'] === 'undefined' ||
		Context.getGlobalContext()['di'] === null
	){
		let Inj : DependencyInjector = new DependencyInjector();
		Context.getGlobalContext()['di'] = Inj;
		console.log('register');
	}
	return Context.getGlobalContext()['di'];
}


export function Autowire(...keys: string[]) {
    // Inj.need(keys[0]);
    return function(target: any, key: string) {
        // property getter
        let getter = function () {
			let Inj : DependencyInjector = DependencyInjectorInstance();
            //console.log(Get: ${key} => ${_val});
            let subname = keys.length > 1 ? keys[1] : 'default';
            return Inj.getInstance(keys[0],subname);
        };

        // Delete property.
        if (delete target[key]) {
            Object.defineProperty(target, key, {
                get: getter
            });
        }
    }
}