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


import {DestructableView} from "../lib/numbersLab/DestructableView";
import {VueVar, VueWatched} from "../lib/numbersLab/VueAnnotate";
import {AppState} from "../model/AppState";
import {Password} from "../model/Password";
import {Wallet} from "../model/Wallet";
import {KeysRepository} from "../model/KeysRepository";
import {BlockchainExplorerProvider} from "../providers/BlockchainExplorerProvider";
import {BlockchainExplorerRpc2} from "../model/blockchain/BlockchainExplorerRpc2";
import {QRReader} from "../model/QRReader";
import {CoinUri} from "../model/CoinUri";
import {Mnemonic} from "../model/Mnemonic";

AppState.enableLeftMenu();

let blockchainExplorer : BlockchainExplorerRpc2 = BlockchainExplorerProvider.getInstance();

class ImportView extends DestructableView{
	@VueVar('') password : string;
	@VueVar('') password2 : string;
	@VueVar(false) insecurePassword : boolean;
	@VueVar(false) forceInsecurePassword : boolean;
	@VueVar(0) importHeight : number;

	private mnemonicSeed : string|null = null;
	private privateSpendKey : string|null = null;
	private privateViewKey : string|null = null;
	private publicAddress : string|null = null;

	constructor(container : string){
		super(container);
	}

	formValid(){
		if(this.password != this.password2)
			return false;

		if(!(this.password !== '' && (!this.insecurePassword || this.forceInsecurePassword)))
			return false;

		if(!(this.privateSpendKey !== null || this.mnemonicSeed !== null || (this.publicAddress !== null && this.privateViewKey !== null)))
			return false;

		return true;
	}

	importWallet(){
		let self = this;
		blockchainExplorer.getHeight().then(function(currentHeight){
			let newWallet = new Wallet();

			if(self.mnemonicSeed !== null) {
				let detectedMnemonicLang = Mnemonic.detectLang(self.mnemonicSeed);
				if(detectedMnemonicLang !== null){
					let mnemonic_decoded = Mnemonic.mn_decode(self.mnemonicSeed, detectedMnemonicLang);
					if(mnemonic_decoded !== null) {
						let keys = cnUtil.create_address(mnemonic_decoded);
						newWallet.keys = KeysRepository.fromPriv(keys.spend.sec, keys.view.sec);
					}else{
						swal({
							type: 'error',
							title: 'Oops...',
							text: 'The mnemonic phrase is invalid',
						});
						return;
					}
				}else{
					swal({
						type: 'error',
						title: 'Oops...',
						text: 'The mnemonic phrase is invalid',
					});
					return;
				}
			}else if(self.privateSpendKey !== null){
				let viewkey = self.privateViewKey !== null ? self.privateViewKey : '';
				if(viewkey === ''){
					viewkey = cnUtil.generate_keys(cnUtil.cn_fast_hash(self.privateSpendKey));
				}
				newWallet.keys = KeysRepository.fromPriv(self.privateSpendKey, viewkey);

			}else if(self.privateSpendKey === null && self.privateViewKey !== null && self.publicAddress !== null){
				let decodedPublic = cnUtil.decode_address(self.publicAddress);
				newWallet.keys = {
					priv:{
						spend:'',
						view:self.privateViewKey
					},
					pub:{
						spend:decodedPublic.spend,
						view:decodedPublic.view,
					}
				};
			}


			let height = self.importHeight;//never trust a perfect value from the user
			if(height >= currentHeight){
				height = currentHeight-1;
			}
			height = height - 10;

			if(height < 0)height = 0;
			newWallet.lastHeight = height;
			newWallet.creationHeight = newWallet.lastHeight;

			AppState.openWallet(newWallet, self.password);
			window.location.href = '#account';
		});
	}

	@VueVar(false) qrScanning : boolean;

	qrReader : QRReader|null = null;

	initQr(){
		this.stopScan();
		this.qrReader = new QRReader();
		this.qrReader.init('/lib/');
	}

	startScan(){
		this.initQr();
		if(this.qrReader) {
			let self = this;
			this.qrScanning = true;
			this.qrReader.scan(function(result : string){
				let parsed = false;
				try{
					let txDetails  = CoinUri.decodeWallet(result);
					if(
						txDetails !== null &&
						(typeof txDetails.spendKey !== 'undefined' || typeof txDetails.mnemonicSeed !== 'undefined')
					){
						if(typeof txDetails.spendKey !== 'undefined')self.privateSpendKey = txDetails.spendKey;
						if(typeof txDetails.mnemonicSeed !== 'undefined')self.mnemonicSeed = txDetails.mnemonicSeed;
						if(typeof txDetails.viewKey !== 'undefined')self.privateViewKey = txDetails.viewKey;
						if(typeof txDetails.height !== 'undefined')self.importHeight = parseInt(''+txDetails.height);
						if(typeof txDetails.address !== 'undefined')self.publicAddress = txDetails.address;
						parsed = true;
					}
				}catch(e){}

				self.qrScanning = false;
				self.stopScan();
			});
		}
	}

	stopScan(){
		if(this.qrReader !== null){
			this.qrReader.stop();
			this.qrReader = null;
			this.qrScanning = false;
		}
	}

	@VueWatched()
	passwordWatch(){
		if(!Password.checkPasswordConstraints(this.password, false)){
			this.insecurePassword = true;
		}else
			this.insecurePassword = false;
	}

	@VueWatched()
	importHeightWatch(){
		if(this.importHeight < 0){
			this.importHeight = 0;
		}
		this.importHeight = parseInt(''+this.importHeight);
	}

	forceInsecurePasswordCheck(){
		let self = this;
		self.forceInsecurePassword = true;
	}

}

new ImportView('#app');
