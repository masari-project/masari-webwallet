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
import {VueRequireFilter, VueVar, VueWatched} from "../lib/numbersLab/VueAnnotate";
import {TransactionsExplorer} from "../model/TransactionsExplorer";
import {WalletRepository} from "../model/WalletRepository";
import {BlockchainExplorerRpc2, WalletWatchdog} from "../model/blockchain/BlockchainExplorerRpc2";
import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Constants} from "../model/Constants";
import {Wallet} from "../model/Wallet";
import {BlockchainExplorer} from "../model/blockchain/BlockchainExplorer";
import {Url} from "../utils/Url";
import {CoinUri} from "../model/CoinUri";
import {QRReader} from "../model/QRReader";
import {AppState} from "../model/AppState";
import {BlockchainExplorerProvider} from "../providers/BlockchainExplorerProvider";
import {VueFilterPiconero} from "../filters/Filters";

let wallet: Wallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
let blockchainExplorer: BlockchainExplorerRpc2 = BlockchainExplorerProvider.getInstance();

AppState.enableLeftMenu();

@VueRequireFilter('piconero', VueFilterPiconero)
class SendView extends DestructableView {
	@VueVar('') destinationAddressUser !: string;
	@VueVar('') destinationAddress !: string;
	@VueVar(false) destinationAddressValid !: boolean;
	@VueVar('10.5') amountToSend !: string;
	@VueVar(false) lockedForm !: boolean;
	@VueVar(true) amountToSendValid !: boolean;
	@VueVar('') paymentId !: string;
	@VueVar(true) paymentIdValid !: boolean;

	@VueVar(null) domainAliasAddress !: string | null;
	@VueVar(null) txDestinationName !: string | null;
	@VueVar(null) txDescription !: string | null;
	@VueVar(true) openAliasValid !: boolean;

	@VueVar(false) qrScanning !: boolean;

	qrReader: QRReader | null = null;
	redirectUrlAfterSend: string | null = null;

	constructor(container: string) {
		super(container);
		let sendAddress = Url.getHashSearchParameter('address');
		let amount = Url.getHashSearchParameter('amount');
		let destinationName = Url.getHashSearchParameter('destName');
		let description = Url.getHashSearchParameter('txDesc');
		let redirect = Url.getHashSearchParameter('redirect');
		if (sendAddress !== null) this.destinationAddressUser = sendAddress.substr(0, 256);
		if (amount !== null) this.amountToSend = amount;
		if (destinationName !== null) this.txDestinationName = destinationName.substr(0, 256);
		if (description !== null) this.txDescription = description.substr(0, 256);
		if (redirect !== null) this.redirectUrlAfterSend = decodeURIComponent(redirect);
	}

	reset() {
		this.lockedForm = false;
		this.destinationAddressUser = '';
		this.destinationAddress = '';
		this.amountToSend = '10.5';
		this.destinationAddressValid = false;
		this.openAliasValid = false;
		this.qrScanning = false;
		this.amountToSendValid = false;
		this.domainAliasAddress = null;
		this.txDestinationName = null;
		this.txDescription = null;

		this.stopScan();
	}

	initQr() {
		this.stopScan();
		this.qrReader = new QRReader();
		this.qrReader.init('/lib/');
	}

	startScan() {
		this.initQr();
		if (this.qrReader) {
			let self = this;
			this.qrScanning = true;
			this.qrReader.scan(function (result: string) {
				let parsed = false;
				try {
					let txDetails = CoinUri.decodeTx(result);
					if (txDetails !== null) {
						self.destinationAddressUser = txDetails.address;
						if (typeof txDetails.description !== 'undefined') self.txDescription = txDetails.description;
						if (typeof txDetails.recipientName !== 'undefined') self.txDestinationName = txDetails.recipientName;
						if (typeof txDetails.amount !== 'undefined') {
							self.amountToSend = txDetails.amount;
							self.lockedForm = true;
						}
						// if(typeof txDetails.paymentId !== 'undefined')self.paymentId = txDetails.paymentId;
						parsed = true;
					}
				} catch (e) {
				}

				try {
					let txDetails = CoinUri.decodeWallet(result);
					if (txDetails !== null) {
						self.destinationAddressUser = txDetails.address;
						parsed = true;
					}
				} catch (e) {
				}

				if (!parsed && result.length === CoinUri.coinAddressLength)
					self.destinationAddressUser = result;
				self.qrScanning = false;
				self.stopScan();
			});
		}
	}

	stopScan() {
		if (this.qrReader !== null) {
			this.qrReader.stop();
			this.qrReader = null;
			this.qrScanning = false;
		}
	}


	destruct(): Promise<void> {
		this.stopScan();
		return super.destruct();
	}

	send() {
		let self = this;
		blockchainExplorer.getHeight().then(function (blockchainHeight: number) {
			let amount = parseFloat(self.amountToSend);
			if (self.destinationAddress !== null) {
				//todo use BigInteger
				if (amount * Math.pow(10, config.coinUnitPlaces) > wallet.unlockedAmount(blockchainHeight)) {
					swal({
						type: 'error',
						title: i18n.t('sendPage.notEnoughMoneyModal.title'),
						text: i18n.t('sendPage.notEnoughMoneyModal.content'),
						confirmButtonText: i18n.t('sendPage.notEnoughMoneyModal.confirmText'),
					});
					return;
				}

				//TODO use biginteger
				let amountToSend = amount * Math.pow(10, config.coinUnitPlaces);
				let destinationAddress = self.destinationAddress;

				swal({
					title: i18n.t('sendPage.creatingTransferModal.title'),
					html: i18n.t('sendPage.creatingTransferModal.content'),
					onOpen: () => {
						swal.showLoading();
					}
				});
				TransactionsExplorer.createTx([{address: destinationAddress, amount: amountToSend}], self.paymentId, wallet, blockchainHeight,
					function (numberOuts: number): Promise<any[]> {
						return blockchainExplorer.getRandomOuts(numberOuts);
					}
					, function (amount: number, feesAmount: number): Promise<void> {
						if (amount + feesAmount > wallet.unlockedAmount(blockchainHeight)) {
							swal({
								type: 'error',
								title: i18n.t('sendPage.notEnoughMoneyModal.title'),
								text: i18n.t('sendPage.notEnoughMoneyModal.content'),
								confirmButtonText: i18n.t('sendPage.notEnoughMoneyModal.confirmText'),
								onOpen: () => {
									swal.hideLoading();
								}
							});
							throw '';
						}

						return new Promise<void>(function (resolve, reject) {
							setTimeout(function () {//prevent bug with swal when code is too fast
								swal({
									title: i18n.t('sendPage.confirmTransactionModal.title'),
									html: i18n.t('sendPage.confirmTransactionModal.content', {
										amount:Vue.options.filters.piconero(amount),
										fees:Vue.options.filters.piconero(feesAmount),
										total:Vue.options.filters.piconero(amount+feesAmount),
									}),
									showCancelButton: true,
									confirmButtonText: i18n.t('sendPage.confirmTransactionModal.confirmText'),
									cancelButtonText: i18n.t('sendPage.confirmTransactionModal.cancelText'),
								}).then(function (result: any) {
									if (result.dismiss) {
										reject('');
									} else {
										swal({
											title: i18n.t('sendPage.finalizingTransferModal.title'),
											html: i18n.t('sendPage.finalizingTransferModal.content'),
											onOpen: () => {
												swal.showLoading();
											}
										});
										resolve();
									}
								}).catch(reject);
							}, 1);
						});
					}).then(function (data: { raw: { hash: string, prvKey: string, raw: string }, signed: any }) {
					blockchainExplorer.sendRawTx(data.raw.raw).then(function () {
						//force a mempool check so the user is up to date
						let watchdog: WalletWatchdog = DependencyInjectorInstance().getInstance(WalletWatchdog.name);
						if (watchdog !== null)
							watchdog.checkMempool();

						let promise = Promise.resolve();
						if (
							destinationAddress === '5qfrSvgYutM1aarmQ1px4aDiY9Da7CLKKDo3UkPuUnQ7bT7tr7i4spuLaiZwXG1dFQbkCinRUNeUNLoNh342sVaqTaWqvt8' ||
							destinationAddress === '5nYWvcvNThsLaMmrsfpRLBRou1RuGtLabUwYH7v6b88bem2J4aUwsoF33FbJuqMDgQjpDRTSpLCZu3dXpqXicE2uSWS4LUP' ||
							destinationAddress === '9ppu34ocgmeZiv4nS2FyQTFLL5wBFQZkhAfph7wGcnFkc8fkCgTJqxnXuBkaw1v2BrUW7iMwKoQy2HXRXzDkRE76Cz7WXkD'
						) {
							promise = swal({
								type: 'success',
								title: i18n.t('sendPage.thankYouDonationModal.title'),
								text: i18n.t('sendPage.thankYouDonationModal.content'),
								confirmButtonText: i18n.t('sendPage.thankYouDonationModal.confirmText'),
							});
						} else
							promise = swal({
								type: 'success',
								title: i18n.t('sendPage.transferSentModal.title'),
								confirmButtonText: i18n.t('sendPage.transferSentModal.confirmText'),
							});

						promise.then(function () {
							if (self.redirectUrlAfterSend !== null) {
								window.location.href = self.redirectUrlAfterSend.replace('{TX_HASH}', data.raw.hash);
							}
						});
					}).catch(function (data: any) {
						swal({
							type: 'error',
							title: i18n.t('sendPage.transferExceptionModal.title'),
							html: i18n.t('sendPage.transferExceptionModal.content', {details: JSON.stringify(data)}),
							confirmButtonText: i18n.t('sendPage.transferExceptionModal.confirmText'),
						});
					});
				}).catch(function (error: any) {
					console.log(error);
					if (error && error !== '') {
						if (typeof error === 'string')
							swal({
								type: 'error',
								title: i18n.t('sendPage.transferExceptionModal.title'),
								html: i18n.t('sendPage.transferExceptionModal.content', {details: error}),
								confirmButtonText: i18n.t('sendPage.transferExceptionModal.confirmText'),
							});
						else
							swal({
								type: 'error',
								title: i18n.t('sendPage.transferExceptionModal.title'),
								html: i18n.t('sendPage.transferExceptionModal.content', {details: JSON.stringify(error)}),
								confirmButtonText: i18n.t('sendPage.transferExceptionModal.confirmText'),
							});
					}
				});
			} else {
				swal({
					type: 'error',
					title: i18n.t('sendPage.invalidAmountModal.title'),
					html: i18n.t('sendPage.invalidAmountModal.content'),
					confirmButtonText: i18n.t('sendPage.invalidAmountModal.confirmText'),
				});
			}
		});
	}

	timeoutResolveAlias = 0;

	@VueWatched()
	destinationAddressUserWatch() {
		if (this.destinationAddressUser.indexOf('.') !== -1) {
			let self = this;
			if (this.timeoutResolveAlias !== 0)
				clearTimeout(this.timeoutResolveAlias);

			this.timeoutResolveAlias = setTimeout(function () {
				blockchainExplorer.resolveOpenAlias(self.destinationAddressUser).then(function (data: { address: string, name: string | null }) {
					try {
						// cnUtil.decode_address(data.address);
						self.txDestinationName = data.name;
						self.destinationAddress = data.address;
						self.domainAliasAddress = data.address;
						self.destinationAddressValid = true;
						self.openAliasValid = true;
					} catch (e) {
						self.destinationAddressValid = false;
						self.openAliasValid = false;
					}
					self.timeoutResolveAlias = 0;
				}).catch(function () {
					self.openAliasValid = false;
					self.timeoutResolveAlias = 0;
				});
			}, 400);
		} else {
			this.openAliasValid = true;
			try {
				cnUtil.decode_address(this.destinationAddressUser);
				this.destinationAddressValid = true;
				this.destinationAddress = this.destinationAddressUser;
			} catch (e) {
				this.destinationAddressValid = false;
			}
		}
	}

	@VueWatched()
	amountToSendWatch() {
		try {
			this.amountToSendValid = !isNaN(parseFloat(this.amountToSend));
		} catch (e) {
			this.amountToSendValid = false;
		}
	}

	@VueWatched()
	paymentIdWatch() {
		try {
			this.paymentIdValid = this.paymentId.length === 0 ||
				(this.paymentId.length === 16 && (/^[0-9a-fA-F]{16}$/.test(this.paymentId))) ||
				(this.paymentId.length === 64 && (/^[0-9a-fA-F]{64}$/.test(this.paymentId)))
			;
		} catch (e) {
			this.paymentIdValid = false;
		}
	}

}


if (wallet !== null && blockchainExplorer !== null)
	new SendView('#app');
else {
	AppState.askUserOpenWallet(false).then(function () {
		wallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
		if (wallet === null)
			throw 'e';
		new SendView('#app');
	}).catch(function () {
		window.location.href = '#index';
	});
}
