declare function swal(params : {
	type?:'success'|'error'|'info'|'warning',
	title:string,
	text?:string,
	input?:'text'|'password'|'email'|'select',
	html?:string,
	showCancelButton?:boolean,
	confirmButtonText?:string,
	focusConfirm?:boolean,
	preConfirm?:Function
	onOpen?:Function,
	onClose?:Function,
	inputOptions?:Map<string,string>|any,
	reverseButtons?:boolean,
	cancelButtonText?:string,
}) : Promise<any>;

declare namespace swal{
	function showLoading() : void;
	function hideLoading() : void;
	function close() : void;
}
