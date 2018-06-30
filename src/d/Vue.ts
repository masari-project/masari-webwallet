type VueConstructObject = {el:string,data:any, watch?:any, computed?:any, updated?:any, mounted?:any, methods?:any, i18n?:any};
type VueComponentObject = {
	template:string,
	props?:Array<string>,
	data?:Function,
	computed:any
}


// declare var Vue : any;
class Vue{
	constructor(any : VueConstructObject|string|null){}

	$nextTick(callback : Function){}
	$forceUpdate(){}

	static component(componentName : string, data : VueComponentObject) : void{}
	static filter(name : string, callback : Function) : void{}

	static options : {
		components:any,
		filters:any
	};
}