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
import {BlockchainExplorerRpc2, WalletWatchdog} from "./blockchain/BlockchainExplorerRpc2";
import {Wallet} from "./Wallet";
import {BlockchainExplorerProvider} from "../providers/BlockchainExplorerProvider";
import {Observable} from "../lib/numbersLab/Observable";
import {WalletRepository} from "./WalletRepository";
import {BlockchainExplorer} from "./blockchain/BlockchainExplorer";
import {Constants} from "./Constants";
import {TransactionsExplorer} from "./TransactionsExplorer";

export class WalletWorker{
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

export class AppState{

	static openWallet(wallet : Wallet, password:string){
		let walletWorker = new WalletWorker(wallet, password);

		DependencyInjectorInstance().register(Wallet.name,wallet);
		let watchdog = BlockchainExplorerProvider.getInstance().watchdog(wallet);
		DependencyInjectorInstance().register(WalletWatchdog.name,watchdog);
		DependencyInjectorInstance().register(WalletWorker.name,walletWorker);

		$('body').addClass('connected');
		if(wallet.isViewOnly())
			$('body').addClass('viewOnlyWallet');
	}

	static disconnect(){
		let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name,'default', false);
		let walletWorker : WalletWorker = DependencyInjectorInstance().getInstance(WalletWorker.name,'default', false);
		let walletWatchdog : WalletWatchdog = DependencyInjectorInstance().getInstance(WalletWatchdog.name,'default', false);
		if(walletWatchdog !== null)
			walletWatchdog.stop();

		DependencyInjectorInstance().register(Wallet.name,undefined,'default');
		DependencyInjectorInstance().register(WalletWorker.name,undefined,'default');
		DependencyInjectorInstance().register(WalletWatchdog.name,undefined,'default');
		$('body').removeClass('connected');
		$('body').removeClass('viewOnlyWallet');
	}

	private static leftMenuEnabled = false;
	static enableLeftMenu(){
		if(!this.leftMenuEnabled) {
			this.leftMenuEnabled = true;
			$('body').removeClass('menuDisabled');
		}
	}
	static disableLeftMenu(){
		if(this.leftMenuEnabled) {
			this.leftMenuEnabled = false;
			$('body').addClass('menuDisabled');
		}
	}

	static askUserOpenWallet(redirectToHome:boolean=true){
		let self = this;
		return new Promise<void>(function (resolve, reject) {
			swal({
				title: i18n.t('global.openWalletModal.title'),
				input: 'password',
				showCancelButton: true,
				confirmButtonText: i18n.t('global.openWalletModal.confirmText'),
				cancelButtonText: i18n.t('global.openWalletModal.cancelText'),
			}).then((result:any) => {
				setTimeout(function(){//for async
					if (result.value) {
						swal({
							type: 'info',
							title: i18n.t('global.loading'),
							onOpen: () => {
								swal.showLoading();
							}
						});

						let savePassword = result.value;
						// let password = prompt();
						let memoryWallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
						if(memoryWallet === null){
							WalletRepository.getLocalWalletWithPassword(savePassword).then((wallet : Wallet|null) => {
								console.log(wallet);
								if (wallet !== null) {
									wallet.recalculateIfNotViewOnly();

									//checking the wallet to find integrity/problems and try to update it before loading
									let blockchainHeightToRescanObj: any = {};
									for (let tx of wallet.getTransactionsCopy()) {
										if (tx.hash === '') {
											blockchainHeightToRescanObj[tx.blockHeight] = true;
										}
									}
									let blockchainHeightToRescan = Object.keys(blockchainHeightToRescanObj);
									if (blockchainHeightToRescan.length > 0) {
										let blockchainExplorer: BlockchainExplorerRpc2 = BlockchainExplorerProvider.getInstance();

										let promisesBlocks = [];
										for (let height of blockchainHeightToRescan) {
											promisesBlocks.push(blockchainExplorer.getTransactionsForBlocks(parseInt(height)));
										}
										Promise.all(promisesBlocks).then(function (arrayOfTxs: Array<RawDaemonTransaction[]>) {
											for (let txs of arrayOfTxs) {
												for (let rawTx of txs) {
													if (wallet !== null) {
														let tx = TransactionsExplorer.parse(rawTx, wallet);
														if (tx !== null)
															wallet.addNew(tx);
													}
												}
											}
										});
									}
									swal.close();
									resolve();

									AppState.openWallet(wallet, savePassword);
									if (redirectToHome)
										window.location.href = '#account';
								} else {
									swal({
										type: 'error',
										title: i18n.t('global.invalidPasswordModal.title'),
										text: i18n.t('global.invalidPasswordModal.content'),
										confirmButtonText: i18n.t('global.invalidPasswordModal.confirmText'),
										onOpen: () => {
											swal.hideLoading();
										}
									});
									reject();
								}
							});
						}else {
							swal.close();
							window.location.href = '#account';
						}
					}else
						reject();
				},1);
			});
		});
	}


}