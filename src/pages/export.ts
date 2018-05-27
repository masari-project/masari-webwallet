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

import {VueClass, VueVar} from "../lib/numbersLab/VueAnnotate";
import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Wallet} from "../model/Wallet";
import {DestructableView} from "../lib/numbersLab/DestructableView";
import {Constants} from "../model/Constants";
import {WalletRepository} from "../model/WalletRepository";
import {Mnemonic} from "../model/Mnemonic";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name,'default', false);
let blockchainExplorer = DependencyInjectorInstance().getInstance(Constants.BLOCKCHAIN_EXPLORER);


class ExportView extends DestructableView{
	@VueVar('') publicAddress: string;

	constructor(container : string){
		super(container);
		let self = this;

		this.publicAddress = wallet.getPublicAddress();
	}

	destruct(): Promise<void> {
		return super.destruct();
	}

	getPrivateKeys(){
		swal({
			title: 'Wallet password',
			input: 'password',
			showCancelButton: true,
			confirmButtonText: 'Export',
		}).then((result:any) => {
			if (result.value) {
				let savePassword = result.value;
				// let password = prompt();
					// let wallet = WalletRepository.getMain();
					let wallet = WalletRepository.getLocalWalletWithPassword(savePassword);
					if(wallet !== null) {
						swal({
							title: 'Private keys',
							html: 'Please store carefully those keys. <b>Possessing them means possessing the funds associated</b> !<br/>'+
'Spend key: '+wallet.keys.priv.spend+'<br/>'+
'Private key: '+wallet.keys.priv.view,
						});
					}else{
						swal({
							type: 'error',
							title: 'Oops...',
							text: 'Your password seems invalid',
						});
					}
			}
		});
	}

	getMnemonicPhrase(){
		swal({
			title: 'Wallet password',
			input: 'password',
			showCancelButton: true,
			confirmButtonText: 'Export',
		}).then((passwordResult:any) => {
			if (passwordResult.value) {
				swal({
					title: 'In which lang do you want your mnemonic phrase ?',
					input: 'select',
					showCancelButton: true,
					confirmButtonText: 'Export',
					inputOptions:{
						'english':'English',
						'chinese':'Chinese (simplified)',
						'dutch':'Dutch',
						'electrum':'Electrum',
						'esperanto':'Esperanto',
						'french':'French',
						'italian':'Italian',
						'japanese':'Japanese',
						'lojban':'Lojban',
						'portuguese':'Portuguese',
						'russian':'Russian',
						'spanish':'Spanish',
					}
				}).then((mnemonicLangResult:any) => {
					let savePassword = passwordResult.value;
					// let password = prompt();
					// let wallet = WalletRepository.getMain();
					let wallet = WalletRepository.getLocalWalletWithPassword(savePassword);
					if (wallet !== null) {
						let mnemonic = Mnemonic.mn_encode(wallet.keys.priv.spend, mnemonicLangResult.value);

						swal({
							title: 'Private keys',
							html: 'Please store carefully this mnemonic phrase. <b>Possessing it means possessing the funds associated</b> ! The phrase in the '+mnemonicLangResult.value+' dictionary is:<br/>' +
							mnemonic
						});
					} else {
						swal({
							type: 'error',
							title: 'Oops...',
							text: 'Your password seems invalid',
						});
					}
				});
			}
		});
	}

	fileExport(){
		swal({
			title: 'Wallet password',
			input: 'password',
			showCancelButton: true,
			confirmButtonText: 'Export',
		}).then((result:any) => {
			if (result.value) {
				let savePassword = result.value;
				// let password = prompt();
				// let wallet = WalletRepository.getMain();
				let wallet = WalletRepository.getLocalWalletWithPassword(savePassword);
				if(wallet !== null) {
					let exported = WalletRepository.getEncrypted(wallet, savePassword);
					let blob = new Blob([JSON.stringify(exported)], {type: "application/json"});
					saveAs(blob, "wallet.json");
				}else{
					swal({
						type: 'error',
						title: 'Oops...',
						text: 'Your password seems invalid',
					});
				}
			}
		});
	}

	exportEcryptedPdf(){
		let self = this;
		swal({
			title: 'Wallet password',
			input: 'password',
			showCancelButton: true,
			confirmButtonText: 'Export',
		}).then((result:any) => {
			if (result.value) {
				let savePassword = result.value;
				// let password = prompt();
				// let wallet = WalletRepository.getMain();
				let wallet = WalletRepository.getLocalWalletWithPassword(savePassword);
				if(wallet !== null) {
					self.downloadEncryptedPdf(wallet, savePassword);
				}else{
					swal({
						type: 'error',
						title: 'Oops...',
						text: 'Your password seems invalid',
					});
				}
			}
		});
	}

	downloadEncryptedPdf(wallet : Wallet, password : string){
		if(wallet.keys.priv.spend === '')
			throw 'missing_spend';

		let encryptedWallet = WalletRepository.getEncrypted(wallet, password);

		let publicQrCode = kjua({
			render: 'canvas',
			text: wallet.getPublicAddress(),
			size:300,
		});

		let privateSpendQrCode = kjua({
			render: 'canvas',
			text: encryptedWallet.encryptedKeys+'+'+encryptedWallet.nonce,
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

if(wallet !== null && blockchainExplorer !== null)
	new ExportView('#app');
else
	window.location.href = '#index';