/*
 * Copyright (c) 2018, Gnock
 * Copyright (c) 2018, The Masari Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
export type NdefMessageText = {
	lang : string,
	content : string
};
export type NdefMessage = {
	text?:NdefMessageText
}

export class Nfc{
	public static ERROR_NO_NFC = 'no_nfc';


	private _nativeNfc : boolean = false;
	private _nativeNfcListening : boolean = false;
	private _pendingNdef : NdefMessageText|null = null;
	private _pendingNdefPromiseResolve : Function|null = null;
	private _pendingNdefPromiseReject : Function|null = null;

	constructor(){
		if(window.nfc) {
			this._nativeNfc = true;
			window.nfc.addNdefListener((event : NativeNfcEvent) => {
				if (event.tag.ndefMessage && window.ndef && window.util){
					for(let record of event.tag.ndefMessage) {
						let ndef : NdefMessage|null = this.parseNdefMessage(record);
						if(ndef !== null)
							for(let callback of this._ndefCallbacks){
								callback(ndef);
							}
					}
				}
				if(this._pendingNdef !== null){
					this.writeNdefOnTag();
				}
			}, (data : any)=>{
				this._nativeNfcListening = true;
			}, function(error : any){
				if(error === 'NFC_DISABLED'){
				}else
					alert(JSON.stringify(error));
			});
		}
	}

	private registerListener(){

	}

	private parseNdefMessage(record : NativeNfcEventNdef) : NdefMessage|null{
		let payload = record.payload.slice();
		if(window.ndef && window.util)
			if(record.tnf === window.ndef.TNF_WELL_KNOWN){
				let langLength = payload.splice(0,1)[0];
				let lang = window.util.bytesToString(payload.splice(0,langLength));
				let text = window.util.bytesToString(payload);
				return {
					text:{
						lang:lang,
						content:text
					}
				}
			}

		return null;
	}

	public get has() : boolean{
		return this._nativeNfc;
	}

	public get writableNfc() : boolean{
		//TODO return true on andorid only
		return this._nativeNfc ? true : false;
	}

	public get enabled() : Promise<void>{
		if(window.nfc) {
			return new Promise<void>(function (resolve, reject) {
				if(window.nfc)
					window.nfc.enabled(function(){
						resolve();
					}, function(error : any){
						alert(error+' '+(<any>window.nfc).NO_NFC);
						// if(window.nfc && error === window.nfc).NO_NFC){
						// 	reject(Nfc.ERROR_NO_NFC);
						// }else
							reject(Nfc.ERROR_NO_NFC);
					});
			});
		}
		return Promise.reject(Nfc.ERROR_NO_NFC);
	}

	private _ndefCallbacks : ((data : NdefMessage) => void)[] = [];

	public listenNdef(callback : (data : NdefMessage) => void){
		this._ndefCallbacks.push(callback);
	}

	public removeNdef(callback : (data : NdefMessage) => void){
		for(let i = 0; i < this._ndefCallbacks.length; ++i){
			if(this._ndefCallbacks[i] === callback){
				this._ndefCallbacks.splice(i,1);
				return true;
			}
		}
		return false;
	}

	public shareNdef(message : NdefMessageText) : Promise<void>{

		return new Promise<void>((resolve, reject) => {
			if(window.nfc && window.ndef) {
				if(message.lang === '')message.lang = 'en';
				let nativeNdef : NativeNfcEventNdef = window.ndef.textRecord(message.content, message.lang);
				window.nfc.share([nativeNdef], function(data :any){
					alert('share ok:'+JSON.stringify(data));
					resolve();
				}, function(data :any){
					alert('share ko:'+JSON.stringify(data));
					reject();
				});
			}else
				reject('not_supported');
		});

	}

	public unshareNdef(){
		if(window.nfc) {
			window.nfc.unshare(function(){

			}, function(){

			});
		}
	}

	public writeNdef(message : NdefMessageText){
		return new Promise((resolve, reject) => {
			this._pendingNdef = message;
			this._pendingNdefPromiseResolve = resolve;
			this._pendingNdefPromiseReject = reject;
		});
	}

	public cancelWriteNdef(){
		this._pendingNdef = null;
	}

	private writeNdefOnTag(){
		if(window.nfc && window.ndef && this._pendingNdef) {
			if(this._pendingNdef.lang === '')this._pendingNdef.lang = 'en';
			let nativeNdef : NativeNfcEventNdef = window.ndef.textRecord(this._pendingNdef.content, this._pendingNdef.lang);

			window.nfc.write([nativeNdef], (data :any) => {
				if(this._pendingNdefPromiseResolve)	this._pendingNdefPromiseResolve();
			}, (data : string) => {
				let error = 'unknown';
				if(data.indexOf('Tag capacity') !== -1)
					error = 'tag_capacity';
				if(this._pendingNdefPromiseReject)	this._pendingNdefPromiseReject(error);
			});
		}
		this._pendingNdef = null;
	}

}