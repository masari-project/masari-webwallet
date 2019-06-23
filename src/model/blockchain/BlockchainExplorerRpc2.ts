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

import {BlockchainExplorer, NetworkInfo, RawDaemon_Transaction} from "./BlockchainExplorer";
import {Wallet} from "../Wallet";
import {MathUtil} from "../MathUtil";
import {CnTransactions, CnUtils} from "../Cn";
import {WalletWatchdog} from "../WalletWatchdog";

export class BlockchainExplorerRpc2 implements BlockchainExplorer{

	// testnet : boolean = true;
	serverAddress = config.apiUrl;

	heightCache = 0;
	heightLastTimeRetrieve = 0;
	getHeight(): Promise<number> {
		if(Date.now() - this.heightLastTimeRetrieve < 20*1000 && this.heightCache !== 0){
			return Promise.resolve(this.heightCache);
		}
		let self = this;
		this.heightLastTimeRetrieve = Date.now();
		return new Promise<number>(function (resolve, reject) {
			$.ajax({
				url: self.serverAddress+'getheight.php',
				method: 'POST',
				data: JSON.stringify({
				})
			}).done(function (raw: any) {
				// self.heightCache = raw.height;
				// resolve(raw.height);
				self.heightCache = parseInt(raw);
				resolve(self.heightCache);
			}).fail(function (data: any) {
				reject(data);
			});
		});
	}

	// getDaemonUrl(){
	// 	return this.testnet ? 'http://localhost:48081/' : 'http://localhost:38081/';
	// }

	scannedHeight : number = 0;

	getScannedHeight(): number{
		return this.scannedHeight;
	}

	watchdog(wallet: Wallet): WalletWatchdog {
		let watchdog = new WalletWatchdog(wallet, this);
		watchdog.loadHistory();
		return watchdog;
	}

	getTransactionsForBlocks(startBlock : number) : Promise<RawDaemon_Transaction[]>{
		let self = this;
		return new Promise<RawDaemon_Transaction[]>(function (resolve, reject) {
			$.ajax({
				url: self.serverAddress+'blockchain.php?height='+startBlock,
				method: 'GET',
				data: JSON.stringify({
				})
			}).done(function (transactions: any) {
				resolve(transactions);
			}).fail(function (data: any) {
				reject(data);
			});
		});
	}

	getTransactionPool() : Promise<RawDaemon_Transaction[]>{
		let self = this;
		return new Promise<RawDaemon_Transaction[]>(function (resolve, reject) {
			$.ajax({
				url: self.serverAddress+'getTransactionPool.php',
				method: 'GET',
			}).done(function (transactions: any) {
				if(transactions !== null)
					resolve(transactions);
			}).fail(function (data: any) {
				console.log('REJECT');
				try{
					console.log(JSON.parse(data.responseText));
				}catch(e){
					console.log(e);
				}
				reject(data);
			});
		});
	}

	nonRandomBlockConsumed = false;

	existingOuts : any[] = [];
	getRandomOuts(nbOutsNeeded : number, initialCall=true) : Promise<any[]>{
		let self = this;
		if(initialCall){
			self.existingOuts = [];
		}

		return this.getHeight().then(function(height : number){
			let txs : RawDaemon_Transaction[] = [];
			let promiseGetCompressedBlocks : Promise<void> = Promise.resolve();

			let randomBlocksIndexesToGet : number[] = [];
			let numOuts = height;

			let compressedBlocksToGet : {[key : string] : boolean} = {};

			console.log('Requires '+nbOutsNeeded+' outs');

			//select blocks for the final mixin. selection is made with a triangular selection
			for(let i = 0; i < nbOutsNeeded; ++i){
				let selectedIndex : number = -1;
				do{
					selectedIndex = MathUtil.randomTriangularSimplified(numOuts);
					if(selectedIndex >= height-config.txCoinbaseMinConfirms)
						selectedIndex = -1;
				}while(selectedIndex === -1 || randomBlocksIndexesToGet.indexOf(selectedIndex) !== -1);
				randomBlocksIndexesToGet.push(selectedIndex);

				compressedBlocksToGet[Math.floor(selectedIndex/100)*100] = true;
			}

			console.log('Random blocks required: ', randomBlocksIndexesToGet);
			console.log('Blocks to get for outputs selections:', compressedBlocksToGet);

			//load compressed blocks (100 blocks) containing the blocks referred by their index
			for(let compressedBlock in compressedBlocksToGet) {
				promiseGetCompressedBlocks = promiseGetCompressedBlocks.then(()=>{
					return self.getTransactionsForBlocks(parseInt(compressedBlock)).then(function (rawTransactions: RawDaemon_Transaction[]) {
						txs.push.apply(txs, rawTransactions);
					});
				});
			}

			return promiseGetCompressedBlocks.then(function(){
				console.log('txs selected for outputs: ', txs);
				let txCandidates : any = {};
				for(let iOut  = 0; iOut < txs.length; ++iOut) {
					let tx = txs[iOut];

					if(
						(typeof tx.height !== 'undefined' && randomBlocksIndexesToGet.indexOf(tx.height) === -1) ||
						typeof tx.height === 'undefined'
					){
						continue;
					}

					// let output_idx_in_tx = Math.floor(Math.random()*out.vout.length);
					/*let extras = TransactionsExplorer.parseExtra(tx.extra);
					let publicKey = '';
					for(let extra of extras)
						if(extra.type === TX_EXTRA_TAG_PUBKEY){
							for (let i = 0; i < 32; ++i) {
								publicKey += String.fromCharCode(extra.data[i]);
							}
							publicKey = CryptoUtils.bintohex(publicKey);
							break;
						}*/

					for (let output_idx_in_tx = 0; output_idx_in_tx < tx.vout.length; ++output_idx_in_tx) {
						let rct = null;
						let globalIndex = output_idx_in_tx;
						if(typeof tx.global_index_start !== 'undefined')
							globalIndex += tx.global_index_start;

						if(parseInt(tx.vout[output_idx_in_tx].amount) !== 0){//check if miner tx
							rct = CnTransactions.zeroCommit(CnUtils.d2s(tx.vout[output_idx_in_tx].amount));
						}else {
							let rtcOutPk = tx.rct_signatures.outPk[output_idx_in_tx];
							let rtcMask = tx.rct_signatures.ecdhInfo[output_idx_in_tx].mask;
							let rtcAmount = tx.rct_signatures.ecdhInfo[output_idx_in_tx].amount;
							rct = rtcOutPk + rtcMask + rtcAmount;
						}

						/*let checkExit = false;
						for (let fo of self.existingOuts) {
							if (
								fo.globalIndex === globalIndex
							) {
								checkExit = true;
								break;
							}
						}

						if (!checkExit) {*/
							let newOut = {
								rct: rct,
								public_key: tx.vout[output_idx_in_tx].target.key,
								global_index: globalIndex,
								// global_index: count,
							};
							if(typeof txCandidates[tx.height] === 'undefined')txCandidates[tx.height] = [];
							txCandidates[tx.height].push(newOut);
						//}
					}
				}

				console.log(txCandidates);

				let selectedOuts = [];
				for(let txsOutsHeight in txCandidates){
					let outIndexSelect = MathUtil.getRandomInt(0, txCandidates[txsOutsHeight].length-1);
					console.log('select '+outIndexSelect+' for '+txsOutsHeight+' with length of '+txCandidates[txsOutsHeight].length);
					selectedOuts.push(txCandidates[txsOutsHeight][outIndexSelect]);
				}

				console.log(selectedOuts);

				return selectedOuts;
			});
		});
	}

	sendRawTx(rawTx : string){
		let self = this;
		return new Promise(function(resolve, reject){
			$.ajax({
				url: self.serverAddress+'sendrawtransaction.php',
				method: 'POST',
				data: JSON.stringify({
					tx_as_hex:rawTx,
					do_not_relay:false
				})
			}).done(function (transactions: any) {
				if(transactions.status && transactions.status == 'OK') {
					resolve(transactions);
				}else
					reject(transactions);
			}).fail(function (data: any) {
				reject(data);
			});
		});
	}

	resolveOpenAlias(domain : string) : Promise<{address:string, name:string|null}>{
		let self = this;
		return new Promise(function(resolve, reject){
			$.ajax({
				url: self.serverAddress+'openAlias.php?domain='+domain,
				method: 'GET',
			}).done(function (response: any) {
				resolve(response);
			}).fail(function (data: any) {
				reject(data);
			});
		});
	}

	getNetworkInfo(): Promise<NetworkInfo> {
		return Promise.reject('not_implemented');
	}


}