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
import {Mnemonic} from "../model/Mnemonic";
import {MnemonicLang} from "../model/MnemonicLang";
import {WalletRepository} from "../model/WalletRepository";

AppState.enableLeftMenu();

let blockchainExplorer : BlockchainExplorerRpc2 = BlockchainExplorerProvider.getInstance();

class ImportView extends DestructableView{
	@VueVar('') password !: string;
	@VueVar('') password2 !: string;
	@VueVar(false) insecurePassword !: boolean;
	@VueVar(false) forceInsecurePassword !: boolean;

	rawFile : any = null;
	invalidRawFile : boolean = false;

	constructor(container : string){
		super(container);
	}

	formValid(){
		if(this.password != this.password2)
			return false;

		if(!(this.password !== '' && (!this.insecurePassword || this.forceInsecurePassword)))
			return false;

		if(this.rawFile === null)
			return false;

		return true;
	}


	selectFile(){
		let self = this;
		let element = $('<input type="file">');
		self.invalidRawFile = true;
		element.on('change', function(event : Event){
			let files :File[] = (<any>event.target).files; // FileList object
			if(files.length > 0) {
				let fileReader = new FileReader();
				fileReader.onload = function () {
					try {
						self.rawFile = JSON.parse(fileReader.result);
						self.invalidRawFile = false;
					}catch (e) {
						self.invalidRawFile = true;
					}
				};

				fileReader.readAsText(files[0]);
			}
		});
		element.click();
	}

	importWallet(){
		let self = this;
		blockchainExplorer.getHeight().then(function(currentHeight){
			setTimeout(function(){
				let newWallet = WalletRepository.decodeWithPassword(self.rawFile,self.password);
				if(newWallet !== null) {
					newWallet.recalculateIfNotViewOnly();
					AppState.openWallet(newWallet, self.password);
					window.location.href = '#account';
				}else{
					swal({
						type: 'error',
						title: i18n.t('global.invalidPasswordModal.title'),
						text: i18n.t('global.invalidPasswordModal.content'),
						confirmButtonText: i18n.t('global.invalidPasswordModal.confirmText'),
					});
				}
			},1);

		});
	}

	@VueWatched()
	passwordWatch(){
		if(!Password.checkPasswordConstraints(this.password, false)){
			this.insecurePassword = true;
		}else
			this.insecurePassword = false;
	}

	forceInsecurePasswordCheck(){
		let self = this;
		self.forceInsecurePassword = true;
	}

}

new ImportView('#app');
