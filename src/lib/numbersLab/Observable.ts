/*
 * Copyright 2018 NumbersLab - https://github.com/NumbersLab
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

export interface Observer{
	observe(eventType : string, data : any) : void;
}

export class Observable{
	static EVENT_MODIFIED = 'modified';

	observers : any = {};

	addObserver(eventType : string, callback : Function){
		if(!(eventType in this.observers))this.observers[eventType] = [];
		this.observers[eventType].push(callback);
	}

	removeObserver(eventType:string, callback : Function){
		if(!(eventType in this.observers)) return;

		for(let i in this.observers[eventType]){
			if(this.observers[eventType][i] == callback){
				this.observers[eventType].splice(i, 1);
				break;
			}
		}
	}

	notify(eventType : string=Observable.EVENT_MODIFIED, data : any=null){
		if(!(eventType in this.observers)) return;

		let observers = [];
		for(let i in this.observers[eventType]){
			observers.push(this.observers[eventType][i]);
		}

		for(let i in observers){
			observers[i](eventType, data);
		}
	}

}