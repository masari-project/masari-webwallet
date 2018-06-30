/*
 * Copyright 2018 NumbersLab - https://github.com/NumbersLab
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

let __extends2 = (function () {
	let extendStatics = Object.setPrototypeOf ||
		({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
		function (d:any, b:any)
		{
			for (let p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
		};
	return function (d:any, b:any) {
		extendStatics(d, b);
		let __ : any = function(this:any) { this.constructor = d; };
		d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
})();


type VueMetaData = {
	watch:any, vars:any, computed:Array<any>, updated:null|string,mounted:null|string,params:any
};

export function VueClass() {
	return function(target: any) : any {
		let instance = /** @class */ (function (_super) {
			__extends2(class_1, _super);

			function class_1(this:any) {
				let args = Array.prototype.slice.call(arguments);

				let initParams : VueConstructObject = {el:'', data:{}};
				if(args.length >= 1 && typeof args[0] == 'string') {
					initParams = {
						el: args[0],
						data: {},
						watch: {},
						computed: {},
						updated: undefined,
					};

					if(typeof (<any>window).i18n !== 'undefined')
						 initParams.i18n = (<any>window).i18n;

					if (typeof this['metadata'] !== 'undefined') {
						let metadata : VueMetaData = this['metadata'];

						for (let varName in metadata.vars) {
							_super[varName] = metadata.vars[varName];
							initParams.data[varName] = metadata.vars[varName];
						}
						for (let varName in metadata.watch) {
							let descriptor: { funcName: string, deep: boolean } = metadata.watch[varName];
							if (descriptor.deep)
								initParams.watch[varName] = {
									handler: this[descriptor.funcName],
									deep: true
								};
							else
								initParams.watch[varName] = this[descriptor.funcName];
						}
						for (let index in metadata.computed) {
							let descriptor: { bindOn: string, action: string, name: string } = metadata.computed[index];
							if (typeof initParams.computed[descriptor.bindOn] === 'undefined')
								initParams.computed[descriptor.bindOn] = {};
							initParams.computed[descriptor.bindOn][descriptor.action] = this[descriptor.name];
						}
						if (metadata.updated !== null) {
							initParams.updated = this[metadata.updated];
						}
						if (metadata.mounted !== null) {
							initParams.mounted = this[metadata.mounted];
						}
					}

					args.push(initParams);
				}
				let _this = _super !== null && _super.apply(this, args) || this;

				return _this;
			}
			return class_1;
		}(target));

		return instance;
	}
}

export function VueWatched(listenedPropertyOrDeep:string|null|boolean='', deep:boolean=false) {
	return function (target : any, propertyKey: string, descriptor: PropertyDescriptor) {
		if(typeof target['metadata'] === 'undefined')target['metadata'] = {watch:{}, vars:{}, computed:[], updated:null,mounted:null,params:{}};
		let listenedProperty : string = '';
		if(listenedPropertyOrDeep === true){
			deep = true;
			listenedPropertyOrDeep = null;
		}else if(listenedPropertyOrDeep === false){
			deep = false;
			listenedPropertyOrDeep = null;
		}else if(listenedPropertyOrDeep === null){
			listenedPropertyOrDeep = '';
		}else{
			listenedProperty = listenedPropertyOrDeep;
		}

		if(listenedProperty === ''){
			let wordsResearch = ['Watch'];
			for(let wordResearch of wordsResearch) {
				if (propertyKey.indexOf(wordResearch) === propertyKey.length - wordResearch.length) {
					listenedProperty = propertyKey.substr(0, propertyKey.length - wordResearch.length);
					break;
				}
			}
		}
		// console.log(listenedProperty);
		target['metadata'].watch[listenedProperty] = {funcName:propertyKey, deep:deep};
	}
}

export function VueVar(defaultValue:any=null) {
	return function PropertyDecorator(target: Object|any,propertyKey: string | symbol) {
		if(typeof target['metadata'] === 'undefined')target['metadata'] = {watch:{}, vars:{}, computed:[], updated:null,mounted:null,params:{}};
		target['metadata'].vars[propertyKey] = defaultValue;
	}
}

export function VueParam() {
	return function PropertyDecorator(target: Object|any,propertyKey: string | symbol) {
		if(typeof target['metadata'] === 'undefined')target['metadata'] = {watch:{}, vars:{}, computed:[], updated:null,mounted:null,params:{}};
		target['metadata'].params[propertyKey] = true;
	}
}

export function VueUpdated() {
	return function PropertyDecorator(target: Object|any,propertyKey: string | symbol) {
		if(typeof target['metadata'] === 'undefined')target['metadata'] = {watch:{}, vars:{}, computed:[], updated:null,mounted:null,params:{}};
		target['metadata'].updated = propertyKey;
	}
}

export function VueComputed(varName:string='', action:'get'|'set'|''='') {
	return function PropertyDecorator(target: Object|any,propertyKey: string) {
		if(typeof target['metadata'] === 'undefined')target['metadata'] = {watch:{}, vars:{}, computed:[], updated:null,mounted:null,params:{}};

		if(varName == '' && action == ''){
			if(propertyKey.indexOf('get') == 0){
				action = 'get';
				varName = propertyKey.charAt(3).toLowerCase()+propertyKey.substr(4);
			}else if(propertyKey.indexOf('set') == 0){
				action = 'set';
				varName = propertyKey.charAt(3).toLowerCase()+propertyKey.substr(4);
			}
		}else if(action == ''){
			action = 'get';
		}

		if(varName == ''){
			varName = propertyKey;
		}

		target['metadata'].computed.push({bindOn:varName,name:propertyKey, action:action});
	}
}

export function VueMounted(){
	return function PropertyDecorator(target: Object|any,propertyKey: string | symbol) {
		if(typeof target['metadata'] === 'undefined')target['metadata'] = {watch:{}, vars:{}, computed:[], updated:null,mounted:null,params:{}};
		target['metadata'].mounted = propertyKey;
	}
}

export function VueRequireComponent(componentName : string) {
	return function (target: any): any {}
}

let allRegisteredVueComponents : any = {};

export function VueComponentAutoRegister(componentName : string){
	return function(target: any) : any {
		if(typeof allRegisteredVueComponents[componentName] !== 'undefined') {

			let instance = new target();

			if (typeof instance.metadata !== 'undefined') {
				let metadata: VueMetaData = instance.metadata;

				let props: Array<string> = [];
				for (let iProp in metadata.params) {
					props.push(iProp);
				}

				let data = function (this: any) {
					// __extends2(target, this);
					for (let i in instance) {
						if (typeof instance[i] === 'function')
							this[i] = instance[i];
					}
					target.apply(this);

					let varsList: any = {};
					for (let iVar in metadata.vars) {
						if (typeof this[iVar] !== 'undefined') {
							varsList[iVar] = this[iVar];
						} else
							varsList[iVar] = metadata.vars[iVar];
					}
					return varsList;
				};

				let computed: any = {};
				for (let index in metadata.computed) {
					let descriptor: { bindOn: string, action: string, name: string } = metadata.computed[index];
					if (typeof computed[descriptor.bindOn] === 'undefined')
						computed[descriptor.bindOn] = {};
					computed[descriptor.bindOn][descriptor.action] = instance[descriptor.name];
				}

				let componentDescriptor: VueComponentObject = {
					template: instance.template,
					props: props,
					data: data,
					computed: computed
				};

				Vue.component(componentName, componentDescriptor);
				allRegisteredVueComponents[componentName] = componentDescriptor;
			}
		}

		return target;
	}
}

let allRegisteredVueFilter : any = {};

export function VueRequireFilter(filterName : string, callback : Function){
	return function(target: any) : any {
		if(
			typeof allRegisteredVueFilter[filterName] !== 'undefined' &&
			allRegisteredVueFilter[filterName] === callback
		){
			console.warn('Already binded Vue Filter on '+filterName);
		}else {
			Vue.filter(filterName, callback);
			allRegisteredVueFilter[filterName] = callback;
		}
		return target;
	}
}