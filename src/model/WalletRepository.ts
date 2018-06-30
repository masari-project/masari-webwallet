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

import {RawWallet, Wallet} from "./Wallet";
import {CoinUri} from "./CoinUri";

export class WalletRepository{
	static hasOneStored(){
		return window.localStorage.getItem('wallet') !== null;
	}
	
	static getWithPassword(rawWallet : RawWallet, password : string) : Wallet|null{
		if(password.length > 32)
			password = password.substr(0 , 32);
		if(password.length < 32){
			password = ('00000000000000000000000000000000'+password).slice(-32);
		}

		let privKey = new (<any>TextEncoder)("utf8").encode(password);
		let nonce = new (<any>TextEncoder)("utf8").encode(rawWallet.nonce);
		// rawWallet.encryptedKeys = this.b64DecodeUnicode(rawWallet.encryptedKeys);
		let encrypted = new Uint8Array(<any>rawWallet.encryptedKeys);
		let decrypted = nacl.secretbox.open(encrypted, nonce, privKey);
		if(decrypted === null)
			return null;
		rawWallet.encryptedKeys = new TextDecoder("utf8").decode(decrypted);
		return Wallet.loadFromRaw(rawWallet);
	}

	static getLocalWalletWithPassword(password : string) : Wallet|null{
		let existingWallet = window.localStorage.getItem('wallet');
		if(existingWallet !== null){
			return this.getWithPassword(JSON.parse(existingWallet), password);
		}else{
			return null;
		}
	}
	
	static save(wallet : Wallet, password : string){
		let rawWallet = this.getEncrypted(wallet, password);
		window.localStorage.setItem('wallet', JSON.stringify(rawWallet));
	}

	static getEncrypted(wallet : Wallet, password : string){
		if(password.length > 32)
			password = password.substr(0 , 32);
		if(password.length < 32){
			password = ('00000000000000000000000000000000'+password).slice(-32);
		}

		let privKey = new (<any>TextEncoder)("utf8").encode(password);
		let rawNonce = nacl.util.encodeBase64(nacl.randomBytes(16));
		let nonce = new (<any>TextEncoder)("utf8").encode(rawNonce);
		let rawWallet = wallet.exportToRaw();
		let uint8EncryptedKeys = new (<any>TextEncoder)("utf8").encode(rawWallet.encryptedKeys);

		let encrypted : Uint8Array = nacl.secretbox(uint8EncryptedKeys, nonce, privKey);
		rawWallet.encryptedKeys = <any>encrypted.buffer;
		let tabEncrypted = [];
		for(let i = 0; i < encrypted.length; ++i){
			tabEncrypted.push(encrypted[i]);
		}
		rawWallet.encryptedKeys = <any>tabEncrypted;
		rawWallet.nonce = rawNonce;
		return rawWallet;
	}

	static deleteLocalCopy(){
		window.localStorage.removeItem('wallet');
	}


	static downloadEncryptedPdf(wallet : Wallet){
		if(wallet.keys.priv.spend === '')
			throw 'missing_spend';

		let coinWalletUri = CoinUri.encodeWalletKeys(
			wallet.getPublicAddress(),
			wallet.keys.priv.spend,
			wallet.keys.priv.view,
			wallet.creationHeight
		);

		let publicQrCode = kjua({
			render: 'canvas',
			text: wallet.getPublicAddress(),
			size:300,
		});

		let privateSpendQrCode = kjua({
			render: 'canvas',
			text: coinWalletUri,
			size:300,
		});

		let doc = new jsPDF('landscape');

		//creating background
		doc.setFillColor(35,31,39);
		doc.rect(0,0,297,210, 'F');

		//white blocks
		doc.setFillColor(255,255,255);
		doc.rect(108,10,80,80, 'F');
		doc.rect(10,115,80,80, 'F');

		//green blocks
		doc.setFillColor(76, 184, 96);
		doc.rect(108,115,80,80, 'F');

		//green background for texts
		doc.setFillColor(76, 184, 96);

		doc.rect(108,15,80,20, 'F');
		doc.rect(10,120,80,20, 'F');

		doc.setTextColor(255, 255, 255);
		doc.setFontSize(30);
		doc.text(15, 135, "Public address");
		doc.text(123,30, "Private key");

		//lines
		doc.setDrawColor(255,255,255);
		doc.setLineWidth(1);
		doc.line(99,0,99,210);
		doc.line(198,0,198,210);
		doc.line(0,105,297,105);

		//adding qr codes
		doc.addImage(publicQrCode.toDataURL(), 'JPEG', 28, 145, 45, 45);
		doc.addImage(privateSpendQrCode.toDataURL(), 'JPEG', 126, 40, 45, 45);

		//wallet help
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(10);
		doc.text(110, 120, "To deposit funds to this paper wallet, send ");
		doc.text(110, 125, "Masari to the public address");

		doc.text(110, 135, "DO NOT REVEAL THE PRIVATE KEY");

		//adding masari logo
		let c : HTMLCanvasElement|null = <HTMLCanvasElement>document.getElementById('canvasExport');
		if(c !== null) {
			let ctx = c.getContext("2d");
			let img: ImageBitmap | null = <ImageBitmap | null>document.getElementById("verticalMasariLogo");
			if (ctx !== null && img !== null) {
				c.width = img.width;
				c.height = img.height;
				ctx.drawImage(img, 0, 0);

				let ratio = img.width/45;
				let smallHeight = img.height/ratio;
				doc.addImage(c.toDataURL(), 'JPEG', 224, 106+(100-smallHeight)/2, 45, smallHeight);
			}
		}

		try {
			doc.save('keys.pdf');
		} catch(e) {
			alert('Error ' + e);
		}

	}



}