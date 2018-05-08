declare function swal(params : {
	type?:'success'|'error'|'info'|'warning',
	title:string,
	text?:string,
	input?:'text'|'password'|'email',
	html?:string,
	showCancelButton?:boolean,
	confirmButtonText?:string,
	focusConfirm?:boolean,
	preConfirm?:Function
	onOpen?:Function
}) : Promise<any>;

declare namespace swal{
	function showLoading() : void;
}
