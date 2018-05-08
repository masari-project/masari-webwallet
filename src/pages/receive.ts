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

import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Wallet} from "../model/Wallet";
import {DestructableView} from "../lib/numbersLab/DestructableView";
import {Constants} from "../model/Constants";
import {VueVar} from "../lib/numbersLab/VueAnnotate";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name,'default', false);

function setTextInClipboard(inputId : string){
	let inputElement : HTMLInputElement = <HTMLInputElement>document.getElementById(inputId);
	let textarea : HTMLInputElement = <HTMLInputElement> document.getElementById('clipboardTextarea');
	if(textarea !== null && inputElement !== null) {
		textarea.value = inputElement.value;
		textarea.select();
	}
	try {
		document.execCommand('copy');
	} catch (err) {
	}
}

class AccountView extends DestructableView{
	@VueVar('') address : string;

	constructor(container : string){
		super(container);
		this.address = wallet.getPublicAddress();
		this.generateQrCode();
	}

	generateQrCode(){
		var el = kjua({
			text: this.address,
			image:document.getElementById('masariQrCodeLogo'),
			size:300,
			mode:'image',
			mSize: 15,
			mPosX: 50,
			mPosY: 50,
		});
		$('#qrCodeContainer').html('');
		$('#qrCodeContainer').append(el);

		/*let qrcode = new QRCode(document.getElementById("qrCodeContainer"), {
			text: this.address,
			width: 128,
			height: 128,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : QRCode.CorrectLevel.H
		});*/
	}

	setInClipboard(){
		setTextInClipboard('address');
	}

}

if(wallet !== null)
	new AccountView('#app');
else
	window.location.href = '#index';