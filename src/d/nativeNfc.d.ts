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

//https://github.com/chariotsolutions/phonegap-nfc/blob/master/www/phonegap-nfc.js

type NativeNfcEventNdef = {
	id:number[],
	tnf:number,
	type:number[],
	payload:number[]
}

declare enum NativeNfcTechType{
	AndroidNfcA="android.nfc.tech.NfcA",
	AndroidMifawareUltralight="android.nfc.tech.MifawareUltralight",
	AndroidNdef="android.nfc.tech.Ndef",
}

type NativeNfcEvent = {
	tag:{
		id:number[],
		techTypes:NativeNfcTechType[],
		maxSize:number,
		isWritable:boolean,
		canMakeReadOnly:boolean,
		ndefMessage?:NativeNfcEventNdef[]
	},
}

type NfcStatus = any;

declare interface NativeNfc{
	NO_NFC : NfcStatus;
	NFC_DISABLED : NfcStatus;
	NO_NFC_OR_NFC_DISABLED : NfcStatus;

	addNdefListener(onDetect : (event : NativeNfcEvent) => void, onCallbackAdded : (params : any) => void, onError : (error : any) => void) : void;
	removeNdefListener(onDetect : (event : NativeNfcEvent) => void, onCallbackAdded : (params : any) => void, onError : (error : any) => void) : void;
	showSettings(onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	close(onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	showSettings(onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	beginSession(onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	invalidateSession(onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	erase(onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	share(ndefMessage : NativeNfcEventNdef[],onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	write(ndefMessage : NativeNfcEventNdef[],onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	unshare(onSuccess : (params : any) => void, onError : (error : any) => void) : void;
	transceive(data : ArrayBuffer|string) : Promise<ArrayBuffer>;

	enabled(onNfcEnable : () => void, onNfcDisabled : (error : any) => void) : void;
}

declare interface NativeNdef{
	TNF_EMPTY : number;
	TNF_WELL_KNOWN : number;//0x01
	TNF_MIME_MEDIA : number;//0x02
	TNF_ABSOLUTE_URI : number;//0x03
	TNF_EXTERNAL_TYPE : number;//0x04
	TNF_UNKNOWN : number;//0x05
	TNF_UNCHANGED : number;//0x06
	TNF_RESERVED : number;//0x07

	record(tnf:number,type:number[],id:number[],payload:number[]) : NativeNfcEventNdef;
	textRecord(text : string, languageCode ?: string, id ?: number[]) : NativeNfcEventNdef;
	uriRecord(text : string, id ?: number[]) : NativeNfcEventNdef;
	emptyRecord() : NativeNfcEventNdef;
}

declare interface NativeUtil{
	toHex(i : number) : string;
	toPrintable(i : number) : string;
	bytesToString(bytes : number[]) : string;
	bytesToHexString(bytes : number[]) : string;
	stringToBytes(str : string) : number[];
	arrayBufferToHexString(buffer : ArrayBuffer) : string;
	hexStringToArrayBuffer(hex : string) : ArrayBuffer;
}

interface Window {
	nfc?:NativeNfc,
	ndef?:NativeNdef,
	util?:NativeUtil
}
