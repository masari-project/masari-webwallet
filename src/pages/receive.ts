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

import {Autowire, DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Wallet} from "../model/Wallet";
import {DestructableView} from "../lib/numbersLab/DestructableView";
import {Constants} from "../model/Constants";
import {VueVar, VueWatched} from "../lib/numbersLab/VueAnnotate";
import {CoinUri} from "../model/CoinUri";
import {Nfc} from "../model/Nfc";
import {Cn} from "../model/Cn";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name,'default', false);

function setTextInClipboard(inputId : string){
	/*let inputElement : HTMLInputElement = <HTMLInputElement>document.getElementById(inputId);
	let textarea : HTMLInputElement = <HTMLInputElement> document.getElementById('clipboardTextarea');
	if(textarea !== null && inputElement !== null) {
		textarea.value = inputElement.value;
		textarea.select();
	}
	try {
		document.execCommand('copy');
	} catch (err) {
	}*/
	let inputElement : HTMLInputElement = <HTMLInputElement>document.getElementById(inputId);
	if(inputElement !== null) {
		inputElement.select();
	}
	try {
		document.execCommand('copy');
	} catch (err) {
	}
}

class AccountView extends DestructableView{
	@VueVar('') rawAddress !: string;
	@VueVar('') address !: string;
	@VueVar('') paymentId !: string;
	@VueVar('') amount !: string;
	@VueVar('') recipientName !: string;
	@VueVar('') txDescription !: string;
	@VueVar(false) hasNfc !: boolean;
	@VueVar(false) hasWritableNfc !: boolean;

	@Autowire(Nfc.name) nfc !: Nfc;

	constructor(container : string){
		super(container);
		this.hasNfc = this.nfc.has;
		this.hasWritableNfc = this.nfc.writableNfc;

		this.rawAddress = wallet.getPublicAddress();
		this.address = wallet.getPublicAddress();
		this.generateQrCode();
	}

	private stringToHex(str : string){
		let hex = '';
		for(let i=0;i<str.length;i++) {
			hex += ''+str.charCodeAt(i).toString(16);
		}
		return hex;
	}

	@VueWatched()
	amountWatch(){
		let parsedAmount = parseFloat(this.amount);
		if(!isNaN(parsedAmount)){
			if(this.amount.indexOf('.') !== -1 && (''+parsedAmount).indexOf('.') === -1)
				this.amount = ''+parsedAmount+'.';
			else
				this.amount = ''+parsedAmount;
		}else
			this.amount = '';
	}

	@VueWatched()
	paymentIdWatch(){
		if(this.paymentId !== '' && this.paymentId.length <= 8) {
			let paymentId8 = ('00000000'+this.stringToHex(this.paymentId)).slice(-16);
			console.log(paymentId8+'==>'+this.stringToHex(this.paymentId));
			this.address = Cn.get_account_integrated_address(wallet.getPublicAddress(), paymentId8);
		}else
			this.address = wallet.getPublicAddress();
	}

	generateQrCode(){
		let el = kjua({
			text: this.getAddressEncoded(),
			image:document.getElementById('masariQrCodeLogo'),
			size:300,
			mode:'image',
			mSize: 10,
			mPosX: 50,
			mPosY: 50,
		});
		$('#qrCodeContainer').html(el);
	}

	private getAddressEncoded() : string{
		return CoinUri.encodeTx(
			this.address,
			this.paymentId !== '' ? this.paymentId : null,
			this.amount !== '' ? this.amount : null,
			this.recipientName !== '' ? this.recipientName: null,
			this.txDescription !== '' ? this.txDescription: null,
		);
	}

	setInClipboard(inputId : string = 'rawAddress'){
		setTextInClipboard(inputId);
	}

	writeOnNfc(){
		swal({
			title: i18n.t('receivePage.waitingNfcToWriteModal.title'),
			html: i18n.t('receivePage.waitingNfcToWriteModal.content'),
			onOpen: () => {
				swal.showLoading();
			},
			onClose: () => {
				this.nfc.cancelWriteNdef();
			}
		}).then((result : any) => {
		});

		this.nfc.writeNdef({
			lang:'en',
			content:this.getAddressEncoded()
		}).then(function(){
			swal({
				type:'success',
				title: i18n.t('receivePage.waitingNfcToWriteModal.titleSuccess'),
			});
		}).catch((data :any)=>{
			if(data === 'tag_capacity'){
				swal({
					type:'error',
					title: i18n.t('receivePage.nfcErrorModal.titleInsufficientCapacity'),
				})
			}else {
				alert('Unknown error:'+JSON.stringify(data));
				swal.close();
			}
			this.nfc.cancelWriteNdef();
		});
	}

	shareWithNfc(){
		swal({
			title: 'Sharing your payment address',
			html: 'Bring closer the other device to share your public information',
			onOpen: () => {
				swal.showLoading();
			},
			onClose: () => {
				this.nfc.unshareNdef();
			}
		}).then((result : any) => {
		});

		this.nfc.shareNdef({
			lang:'en',
			content:this.getAddressEncoded()
		}).then(()=>{
			swal({
				type:'success',
				title: 'Information shared',
			});
			this.nfc.unshareNdef();
		}).catch(() => {
			this.nfc.unshareNdef();
		});
	}


	destruct(): Promise<void> {
		this.nfc.unshareNdef();
		this.nfc.cancelWriteNdef();
		swal.close();
		return super.destruct();
	}
}

if(wallet !== null)
	new AccountView('#app');
else
	window.location.href = '#index';