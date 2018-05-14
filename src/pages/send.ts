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
import {BlockchainExplorer} from "../model/blockchain/BlockchainExplorer";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
let blockchainExplorer : BlockchainExplorerRpc2 = DependencyInjectorInstance().getInstance(Constants.BLOCKCHAIN_EXPLORER);


class SendView extends DestructableView{
	@VueVar('') destinationAddress : string;
	@VueVar(false) destinationAddressValid : boolean;
	@VueVar('10.5') amountToSend : string;
	@VueVar(true) amountToSendValid : boolean;

	constructor(container : string){
		super(container);
	}

	send(){
		let self = this;
		blockchainExplorer.getHeight().then(function(blockchainHeight:number){
			let amount = parseFloat(self.amountToSend);
			if(amount > 0 && self.destinationAddress !== null){
				//todo use BigInteger
				if(amount*Math.pow(10,config.coinUnitPlaces) > wallet.unlockedAmount(blockchainHeight)){
					swal({
						type: 'error',
						title: 'Oops...',
						text: 'You don\'t have enough funds in your wallet to execute this transfer',
					});
					return;
				}

				//TODO use biginteger
				let amountToSend = amount * Math.pow(10,config.coinUnitPlaces);
				let destinationAddress = self.destinationAddress;
				swal({
					title: 'Creating transfer ...',
					text:'Please wait...',
					onOpen: () => {
						swal.showLoading();
					}
					// showCancelButton: true,
					// confirmButtonText: 'Confirm',
				});

				blockchainExplorer.getRandomOuts(12).then(function(mix_outs:any[]){
					// let mix_outs : any[] = [];
					console.log('------------------------------mix_outs',mix_outs);
					TransactionsExplorer.createTx([{address:destinationAddress, amount:amountToSend}],'',wallet,blockchainHeight,mix_outs, function(amount:number, feesAmount : number) : Promise<void>{
						return swal({
							title: 'Confirm transfer ?',
							html: 'Amount: '+Vue.options.filters.piconero(amount)+'<br/>Fees: '+Vue.options.filters.piconero(feesAmount),
							showCancelButton: true,
							confirmButtonText: 'Confirm',
						}).then(function(result:any){
							if(result.dismiss){
								return Promise.reject<void>('');
							}
						});
					}).then(function(data : {raw : string, signed:any}){
						blockchainExplorer.sendRawTx(data.raw).then(function(){
							//force a mempool check so the user is up to date
							let watchdog : WalletWatchdog = DependencyInjectorInstance().getInstance(WalletWatchdog.name);
							if(watchdog !== null)
								watchdog.checkMempool();

							if(destinationAddress === '5qfrSvgYutM1aarmQ1px4aDiY9Da7CLKKDo3UkPuUnQ7bT7tr7i4spuLaiZwXG1dFQbkCinRUNeUNLoNh342sVaqTaWqvt8'){
								swal({
									type:'success',
									title: 'Thank you for donation !',
									html:'Your help is appreciated. <br/>This donation will contribute to make this webwallet better'
								});
							}else if(destinationAddress === '5nYWvcvNThsLaMmrsfpRLBRou1RuGtLabUwYH7v6b88bem2J4aUwsoF33FbJuqMDgQjpDRTSpLCZu3dXpqXicE2uSWS4LUP'){
								swal({
									type:'success',
									title: 'Thank you for donation !',
									text:'Your help is appreciated'
								});
							}else
								swal({
									type:'success',
									title: 'Transfer sent !',
								});
						}).catch(function(data:any){
							swal({
								type: 'error',
								title: 'Oops...',
								text: 'An error occurred. Please report us this error: '+JSON.stringify(data),
							});
						});
					}).catch(function(error:any){
						if(error && error !== ''){
							alert(error);
						}
					});
				});
			}else{
				swal({
					type: 'error',
					title: 'Oops...',
					text: 'Invalid amount',
				});
			}
		});
	}

	@VueWatched()
	destinationAddressWatch(){
		try {
			cnUtil.decode_address(this.destinationAddress);
			this.destinationAddressValid = true;
		}catch(e){
			this.destinationAddressValid = false;
		}
	}

	@VueWatched()
	amountToSendWatch(){
		try{
			this.amountToSendValid = !isNaN(parseFloat(this.amountToSend));
		}catch(e){
			this.amountToSendValid = false;
		}
	}

}


if(wallet !== null && blockchainExplorer !== null)
	new SendView('#app');
else
	window.location.href = '#index';
