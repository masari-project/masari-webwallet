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

import {WalletRepository} from "../model/WalletRepository";
import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Constants} from "../model/Constants";
import {BlockchainExplorerRpc2, WalletWatchdog} from "../model/blockchain/BlockchainExplorerRpc2";
import {VueRequireFilter, VueVar} from "../lib/numbersLab/VueAnnotate";
import {DestructableView} from "../lib/numbersLab/DestructableView";
import {Wallet} from "../model/Wallet";
import {BlockchainExplorer} from "../model/blockchain/BlockchainExplorer";
import {KeysRepository} from "../model/KeysRepository";
import {Observable, Observer} from "../lib/numbersLab/Observable";
import {VueFilterDate} from "../filters/Filters";
import {Mnemonic} from "../model/Mnemonic";
import {TransactionsExplorer} from "../model/TransactionsExplorer";

let injector = DependencyInjectorInstance();

let blockchainExplorer : BlockchainExplorerRpc2 = injector.getInstance(Constants.BLOCKCHAIN_EXPLORER);
if(blockchainExplorer === null) {
	blockchainExplorer = new BlockchainExplorerRpc2();
	injector.register(Constants.BLOCKCHAIN_EXPLORER, blockchainExplorer);
}

class WalletWorker{
	wallet : Wallet;
	password : string;

	intervalSave = 0;

	constructor(wallet: Wallet, password:string) {
		this.wallet = wallet;
		this.password = password;
		let self = this;
		wallet.addObserver(Observable.EVENT_MODIFIED, function(){
			if(self.intervalSave === 0)
				self.intervalSave = setTimeout(function(){
					self.save();
					self.intervalSave = 0;
				}, 1000);
		});

		this.save();
	}

	save(){
		WalletRepository.save(this.wallet, this.password);
	}
}

class IndexView extends DestructableView{
	@VueVar(false) hasLocalWallet : boolean;
	@VueVar(false) isWalletLoaded : boolean;
	@VueVar(false) importSelectorActive : boolean;


	constructor(container : string){
		super(container);
		this.isWalletLoaded = DependencyInjectorInstance().getInstance(Wallet.name,'default', false) !== null;
		this.hasLocalWallet = WalletRepository.hasOneStored();
		// this.importWallet();
	}

	destruct(): Promise<void> {
		return super.destruct();
	}

	loadWallet(){
		swal({
			title: 'Wallet password',
			input: 'password',
			showCancelButton: true,
			confirmButtonText: 'open',
		}).then((result:any) => {
			if (result.value) {
				let savePassword = result.value;
				// let password = prompt();
				let memoryWallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
				if(memoryWallet === null){
					// let wallet = WalletRepository.getMain();
					let wallet = WalletRepository.getLocalWalletWithPassword(savePassword);
					if(wallet !== null) {
						console.log(wallet);
						this.setupWallet(wallet, savePassword);
						window.location.href = '#account';
					}else{
						swal({
							type: 'error',
							title: 'Oops...',
							text: 'Your password seems invalid',
						});
					}
				}
			}
		});
	}

	loadWalletFromFile(){
		let self = this;
		let element = $('<input type="file">');
		element.on('change', function(event : Event){
			let files :File[] = (<any>event.target).files; // FileList object
			if(files.length > 0) {
				let fileReader = new FileReader();
				fileReader.onload = function () {
					swal({
						title: 'Wallet password',
						input: 'password',
						showCancelButton: true,
						confirmButtonText: 'open',
					}).then((passwordResult:any) => {
						if (passwordResult.value) {
							let savePassword = passwordResult.value;
							let newWallet = WalletRepository.getWithPassword(JSON.parse(fileReader.result),savePassword);
							if(newWallet !== null) {
								self.setupWallet(newWallet, savePassword);
								window.location.href = '#account';
							}else{
								swal({
									type: 'error',
									title: 'Oops...',
									text: 'Your password seems invalid',
								});
							}
						}
					});
				};

				fileReader.readAsText(files[0]);
			}else{
				swal({
					type: 'error',
					title: 'Oops...',
					text: 'Please select a file to import',
				});
			}
		});
		element.click();

	}

	setupWallet(wallet : Wallet, password:string){
		let walletWorker = new WalletWorker(wallet, password);

		DependencyInjectorInstance().register(Wallet.name,wallet);
		let watchdog = blockchainExplorer.watchdog(wallet);
		DependencyInjectorInstance().register(WalletWatchdog.name,watchdog);

		$('body').addClass('connected');
	}

	importWallet(){
		let self = this;
		swal({
			title: 'Import a wallet',
			html:
			`
<div class="importKeys" >
	<div>
		<label>Password for the wallet</label>
		<input id="importWalletPassword" placeholder="Password for the wallet" autocomplete="off">
	</div>
	<div>
		<label>Spend key</label>
		<input id="importWalletSpendKey" placeholder="Spend key" autocomplete="off">
	</div>
	<div>
		<label>View key</label>
		<input id="importWalletViewKey" placeholder="View key" autocomplete="off">
	</div>
	<div>
		<label>Height from which to start scanning</label>
		<input type="number" id="importWalletHeight" placeholder="Height from which to start scanning" value="0">
	</div>
</div>
`,
			focusConfirm: false,
			preConfirm: () => {
				let passwordInput = <HTMLInputElement>document.getElementById('importWalletPassword');
				let passwordSpend = <HTMLInputElement>document.getElementById('importWalletSpendKey');
				let passwordView = <HTMLInputElement>document.getElementById('importWalletViewKey');
				let passwordHeight = <HTMLInputElement>document.getElementById('importWalletHeight');
				return {
					password:passwordInput !== null ? passwordInput.value : null,
					spend:passwordSpend !== null ? passwordSpend.value : null,
					view:passwordView !== null ? passwordView.value : null,
					height:passwordHeight !== null ? parseInt(passwordHeight.value) : null,
				}
			}
		}).then(function(result:{value:{password:string|null,spend:string|null,view:string|null,height:number|null}}){
			blockchainExplorer.getHeight().then(function(currentHeight){
				console.log(result.value);
				if(	result.value &&
					result.value.spend && result.value.view && result.value.password &&  result.value.height &&
					result.value.spend.length > 0 &&
					result.value.view.length > 0 &&
					result.value.height >= 0 &&
					result.value.password.length > 0
				){
					if(!self.checkPasswordConstraints(result.value.password))
						return;

					let newWallet = new Wallet();
					newWallet.keys = KeysRepository.fromPriv(result.value.spend, result.value.view);
					if(result.value.height >= currentHeight){
						result.value.height = currentHeight-1;
					}

					let height = currentHeight - 10;
					if(height < 0)height = 0;
					newWallet.lastHeight = height;

					self.setupWallet(newWallet, result.value.password);
					window.location.href = '#account';
					// }

				}
			});
		});
	}

	createNewWallet(){
		let self = this;
		swal({
			title: 'New wallet',
			html:
				`
<div class="importKeys" >
	<div>
		<label>Password for the wallet</label>
		<input type="password" id="importWalletPassword" placeholder="Password for the wallet" autocomplete="off">
	</div>
</div>
`,
			focusConfirm: false,
			preConfirm: () => {
				let passwordInput = <HTMLInputElement>document.getElementById('importWalletPassword');
				return {
					password:passwordInput !== null ? passwordInput.value : null,
				}
			}
		}).then(function(result:{value:{password:string|null}}){
			blockchainExplorer.getHeight().then(function(currentHeight){
				console.log(result.value);
				if(	result.value &&
					result.value.password &&
					result.value.password.length > 0
				){
					if(!self.checkPasswordConstraints(result.value.password))
						return;

					let seed = cnUtil.sc_reduce32(cnUtil.rand_32());
					console.log(seed,cnUtil.rand_32());

					let keys = cnUtil.create_address(seed);

					let newWallet = new Wallet();
					newWallet.keys = KeysRepository.fromPriv(keys.spend.sec, keys.view.sec);
					let height = currentHeight - 10;
					if(height < 0)height = 0;
					newWallet.lastHeight = height;
					self.setupWallet(newWallet, result.value.password);

					swal({
						type: 'info',
						title: 'Information',
						text: 'Please make a backup of your private keys by going in the export tab',
					});

					window.location.href = '#account';
				}
			});
		});


	}

	importFromMnemonic(){
		let self = this;
		swal({
			title: 'New wallet',
			html:
				`
<div class="importKeys" >
	<div>
		<label>Password for the wallet</label>
		<input type="password" id="importWalletPassword" placeholder="Password for the wallet" autocomplete="off">
	</div>
	<div>
		<label>Mnemonic phrase</label>
		<input id="importWalletMnemonic" placeholder="Your 25 words">
	</div>
	<div>
		<label>The menmonic lang</label>
		<select id="importWalletMnemonicLang" >
			<option value="english" >English</option>
			<option value="chinese" >Chinese (simplified)</option>
			<option value="french" >French</option>
			<option value="dutch" >Dutch</option>
			<option value="italian" >Italian</option>
			<option value="spanish" >Spanish</option>
			<option value="portuguese" >Portuguese</option>
			<option value="japanese" >Japanese</option>
			<option value="electrum" >Electrum</option>
		</select>
	</div>
	<div>
		<label>Height from which to start scanning</label>
		<input type="number" id="importWalletHeight" placeholder="Height from which to start scanning" value="0">
	</div>
</div>
`,
			focusConfirm: false,
			preConfirm: () => {
				let passwordInput = <HTMLInputElement>document.getElementById('importWalletPassword');
				let mnemonicInput = <HTMLInputElement>document.getElementById('importWalletMnemonic');
				let mnemonicLangInput = <HTMLInputElement>document.getElementById('importWalletMnemonicLang');
				let heightInput = <HTMLInputElement>document.getElementById('importWalletHeight');
				return {
					password:passwordInput !== null ? passwordInput.value : null,
					mnemonic:mnemonicInput !== null ? mnemonicInput.value : null,
					mnemonicLang:mnemonicLangInput !== null ? mnemonicLangInput.value : null,
					height:heightInput !== null ? heightInput.value : null,
				}
			}
		}).then(function(result:{value:{password:string|null, mnemonic:string|null,mnemonicLang:string|null,height:number|null}}){
				if(	result.value &&
					result.value.password &&
					result.value.mnemonic &&
					result.value.mnemonicLang &&
					result.value.height &&
					result.value.password.length > 0 &&
					result.value.mnemonic.length > 0
				){
					if(!self.checkPasswordConstraints(result.value.password))
						return;

					// let mnemonic = 'always afraid tobacco poetry woes today pause glass hesitate nail doing fitting obtains vexed bypass costume cupcake betting muzzle shrugged fruit getting adapt alarms doing';
					let mnemonic = result.value.mnemonic;
					// let current_lang = 'english';
					let current_lang = result.value.mnemonicLang;
					let mnemonic_decoded = Mnemonic.mn_decode(mnemonic, current_lang);
					if(mnemonic_decoded !== null) {
						let keys = cnUtil.create_address(mnemonic_decoded);

						let newWallet = new Wallet();
						newWallet.keys = KeysRepository.fromPriv(keys.spend.sec, keys.view.sec);

						let height = result.value.height - 10;
						if (height < 0) height = 0;
						newWallet.lastHeight = height;
						self.setupWallet(newWallet, result.value.password);
						window.location.href = '#account';
					}else{
						swal({
							type: 'error',
							title: 'Oops...',
							text: 'The mnemonic phrase is invalid',
						});
					}
				}
		});

	}

	checkPasswordConstraints(password : string, raiseError : boolean = true){
		var anUpperCase = /[A-Z]/;
		var aLowerCase = /[a-z]/;
		var aNumber = /[0-9]/;
		var aSpecial = /[!|@|#|$|%|^|&|*|(|)|-|_]/;

		var numUpper = 0;
		var numLower = 0;
		var numNums = 0;
		var numSpecials = 0;
		for(var i=0; i<password.length; i++){
			if(anUpperCase.test(password[i]))
				numUpper++;
			else if(aLowerCase.test(password[i]))
				numLower++;
			else if(aNumber.test(password[i]))
				numNums++;
			else if(aSpecial.test(password[i]))
				numSpecials++;
		}

		if(password.length < 8 || numUpper < 1 || numLower < 1 || numNums < 1 || numSpecials < 1){
			if(raiseError){
				swal({
					type: 'error',
					title: 'The password is not complex enough',
					text: 'The password need at least 8 characters, 1 upper case letter, 1 lower case letter, one number and one special character',
				});
			}

			return false;
		}

		return true;
	}


}

let newIndexView = new IndexView('#app');
