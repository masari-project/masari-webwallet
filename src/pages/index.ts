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
import {BlockchainExplorerProvider} from "../providers/BlockchainExplorerProvider";
import {AppState} from "../model/AppState";
import {Password} from "../model/Password";

let injector = DependencyInjectorInstance();

let blockchainExplorer = BlockchainExplorerProvider.getInstance();

class IndexView extends DestructableView{
	@VueVar(false) hasLocalWallet : boolean;
	@VueVar(false) isWalletLoaded : boolean;

	constructor(container : string){
		super(container);
		this.isWalletLoaded = DependencyInjectorInstance().getInstance(Wallet.name,'default', false) !== null;
		this.hasLocalWallet = WalletRepository.hasOneStored();
		// this.importWallet();
		AppState.disableLeftMenu();
	}

	destruct(): Promise<void> {
		return super.destruct();
	}

	loadWallet(){
		let self = this;
		swal({
			title: 'Wallet password',
			input: 'password',
			showCancelButton: true,
			confirmButtonText: 'Open',
		}).then((result:any) => {
			setTimeout(function(){//for async
			if (result.value) {
				let savePassword = result.value;
				// let password = prompt();
				let memoryWallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
				if(memoryWallet === null){
					// let wallet = WalletRepository.getMain();
					let wallet = WalletRepository.getLocalWalletWithPassword(savePassword);
					if(wallet !== null) {
						wallet.recalculateIfNotViewOnly();
						AppState.openWallet(wallet, savePassword);
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
			},1);
		});
	}

}

let newIndexView = new IndexView('#app');
