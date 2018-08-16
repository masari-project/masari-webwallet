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
import {TransactionsExplorer} from "../model/TransactionsExplorer";
import {WalletRepository} from "../model/WalletRepository";
import {BlockchainExplorerRpc2, WalletWatchdog} from "../model/blockchain/BlockchainExplorerRpc2";
import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Constants} from "../model/Constants";
import {Wallet} from "../model/Wallet";
import {AppState, WalletWorker} from "../model/AppState";
import {Password} from "../model/Password";
import {BlockchainExplorerProvider} from "../providers/BlockchainExplorerProvider";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
let blockchainExplorer : BlockchainExplorerRpc2 = BlockchainExplorerProvider.getInstance();
let walletWatchdog : WalletWatchdog = DependencyInjectorInstance().getInstance(WalletWatchdog.name,'default', false);

class ChangeWalletPasswordView extends DestructableView{
	@VueVar('') oldPassword !: string;
	@VueVar(false) invalidOldPassword !: boolean;

	@VueVar('') walletPassword !: string;
	@VueVar('') walletPassword2 !: string;
	@VueVar(false) insecurePassword !: boolean;
	@VueVar(false) forceInsecurePassword !: boolean;

	constructor(container : string){
		super(container);
	}

	@VueWatched()
	oldPasswordWatch(){
		let wallet = WalletRepository.getLocalWalletWithPassword(this.oldPassword);
		if(wallet !== null) {
			this.invalidOldPassword = false;
		}else
			this.invalidOldPassword = true;
	}

	forceInsecurePasswordCheck(){
		let self = this;
		self.forceInsecurePassword = true;
	}

	@VueWatched()
	walletPasswordWatch(){
		if(!Password.checkPasswordConstraints(this.walletPassword, false)){
			this.insecurePassword = true;
		}else
			this.insecurePassword = false;
	}

	changePassword(){
		let walletWorker : WalletWorker = DependencyInjectorInstance().getInstance(WalletWorker.name,'default', false);
		if(walletWorker !== null){
			walletWorker.password = this.walletPassword;
			walletWorker.save();

			swal({
				type:'success',
				title:i18n.t('changeWalletPasswordPage.modalSuccess.title'),
				confirmButtonText:i18n.t('changeWalletPasswordPage.modalSuccess.confirmText'),
			});
			this.oldPassword = '';
			this.walletPassword = '';
			this.walletPassword2 = '';
			this.insecurePassword = false;
			this.forceInsecurePassword = false;
			this.invalidOldPassword = false;
		}
	}


}


if(wallet !== null && blockchainExplorer !== null)
	new ChangeWalletPasswordView('#app');
else
	window.location.href = '#index';
