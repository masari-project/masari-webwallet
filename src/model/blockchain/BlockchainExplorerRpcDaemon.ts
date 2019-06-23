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

export type DaemonResponseGetInfo = {
	"alt_blocks_count": number,
	"block_size_limit": number,
	"block_size_median": number,
	"bootstrap_daemon_address": string,
	"cumulative_difficulty": number,
	"cumulative_weight": number,
	"difficulty": number,
	"free_space": number,
	"grey_peerlist_size": number,
	"height": number,
	"height_without_bootstrap": number,
	"incoming_connections_count": number,
	"mainnet": boolean,
	"offline": boolean,
	"outgoing_connections_count": number,
	"rpc_connections_count": number,
	"stagenet": boolean,
	"start_time": number,
	"status": "OK"|string,
	"target": number,
	"target_height": number,
	"testnet": boolean,
	"top_block_hash": string,
	"tx_count": number,
	"tx_pool_size": number,
	"untrusted": boolean,
	"was_bootstrap_ever_used": boolean,
	"white_peerlist_size": number
}

export class BlockchainExplorerRpcDaemon implements BlockchainExplorer{
	daemonAddress = config.trustedDaemonsAddresses[0];
	phpProxy : boolean = false;

	constructor(daemonAddress : string|null = null){
		if(daemonAddress !== null && daemonAddress.trim() !== ''){
			this.daemonAddress = daemonAddress;
		}
		if(this.daemonAddress.indexOf('localhost') !== -1 || this.daemonAddress.indexOf('127.0.0.1') !== -1){
			this.phpProxy = true;
		}
	}

	protected makeRpcRequest(method : string, params : any = {}) : Promise<any>{
		return new Promise<any>( (resolve, reject)=> {
			$.ajax({
				url: this.daemonAddress+'json_rpc'+(this.phpProxy ? '.php' : ''),
				method: 'POST',
				data: JSON.stringify({
					jsonrpc:'2.0',
					method:method,
					params:params,
					id:0
				}),
				contentType:'application/json'
			}).done(function (raw: any) {
				if(
					typeof raw.id === 'undefined' ||
					typeof raw.jsonrpc === 'undefined' ||
					raw.jsonrpc !== '2.0' ||
					typeof raw.result !== 'object'
				)
					reject('Daemon response is not properly formatted');
				else
					resolve(raw.result);
			}).fail(function (data: any) {
				reject(data);
			});
		});
	}

	protected makeRequest(method: 'GET'|'POST', url : string, body : any = undefined) : Promise<any>{
		return new Promise<any>( (resolve, reject)=> {
			$.ajax({
				url: this.daemonAddress+url+(this.phpProxy ? '.php' : ''),
				method: method,
				data: typeof body === 'string' ? body : JSON.stringify(body)
			}).done(function (raw: any) {
				resolve(raw);
			}).fail(function (data: any) {
				reject(data);
			});
		});
	}

	cacheInfo : any = null;
	lastTimeRetrieveInfo = 0;
	getInfo(): Promise<DaemonResponseGetInfo> {
		if(Date.now() - this.lastTimeRetrieveInfo < 20*1000 && this.cacheInfo !== null){
			return Promise.resolve(this.cacheInfo);
		}

		this.lastTimeRetrieveInfo = Date.now();
		return this.makeRpcRequest('get_info').then((data : DaemonResponseGetInfo)=>{
			this.cacheInfo = data;
			return data;
		})
	}

	getHeight(): Promise<number> {
		return this.getInfo().then((info : DaemonResponseGetInfo)=>info.height);
	}

	scannedHeight : number = 0;

	getScannedHeight(): number{
		return this.scannedHeight;
	}

	watchdog(wallet: Wallet): WalletWatchdog {
		let watchdog = new WalletWatchdog(wallet, this);
		watchdog.loadHistory();
		return watchdog;
	}

	/**
	 * Returns an array containing all numbers like [start;end]
	 * @param start
	 * @param end
	 */
	range(start : number, end : number){
		let numbers : number[] = [];
		for(let i = start; i<= end;++i){
			numbers.push(i);
		}

		return numbers;
	}

	getTransactionsForBlocks(startBlock : number,  endBlock : number, includeMinerTxs = true) : Promise<RawDaemon_Transaction[]>{
		let heights = this.range(startBlock, endBlock);
		return this.makeRequest('POST', 'gettransactions_by_heights', {heights:heights, prune:true, decode_as_json:true, include_miner_txs:includeMinerTxs}).then((answer : {
			status:'OK'|'string',
			txs:{as_hew:string, as_json:string, block_height:number, block_timestamp:number, output_indices:number[], tx_hash:string}[]
		})=>{
			let formatted : RawDaemon_Transaction[] = [];

			if(answer.status !== 'OK') throw 'invalid_transaction_answer';

			for(let rawTx of answer.txs){
				let tx : RawDaemon_Transaction|null = null;
				try {
					tx = JSON.parse(rawTx.as_json);
				}catch (e) {
					try {
						//compat for some invalid endpoints
						tx = JSON.parse('{"t":1' + rawTx.as_json + '}');
					}catch (e) {}
				}
				if(tx !== null) {
					tx.ts = rawTx.block_timestamp;
					tx.height = rawTx.block_height;
					if (rawTx.output_indices.length > 0)
						tx.global_index_start = rawTx.output_indices[0];

					formatted.push(tx);
				}
			}

			return formatted;
		});
	}

	getTransactionPool() : Promise<RawDaemon_Transaction[]>{
		return this.makeRequest('GET', 'get_transaction_pool').then((rawTransactions : {tx_blob:string, tx_json:string}[])=>{
			let formatted : RawDaemon_Transaction[] = [];
			for(let rawTransaction of rawTransactions){
				try {
					formatted.push(JSON.parse(rawTransaction.tx_json));
				}catch (e) {
					console.error(e);
				}
			}
			return formatted;
		});
	}

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
					return self.getTransactionsForBlocks(parseInt(compressedBlock), Math.min(parseInt(compressedBlock)+99, height-config.txCoinbaseMinConfirms)).then(function (rawTransactions: RawDaemon_Transaction[]) {
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

						let newOut = {
							rct: rct,
							public_key: tx.vout[output_idx_in_tx].target.key,
							global_index: globalIndex,
							// global_index: count,
						};
						if(typeof txCandidates[tx.height] === 'undefined')txCandidates[tx.height] = [];
						txCandidates[tx.height].push(newOut);

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
		return this.makeRequest('POST', 'sendrawtransaction', {
			tx_as_hex:rawTx,
			do_not_relay:false
		}).then((transactions : any)=>{
			if(!transactions.status || transactions.status !== 'OK')
				throw transactions;
		});
	}

	resolveOpenAlias(domain : string) : Promise<{address:string, name:string|null}>{
		return this.makeRpcRequest('resolve_open_alias', {url:domain}).then(function(response : {
			addresses?:string[],
			status:'OK'|string
		}){
			if(response.addresses && response.addresses.length > 0)
				return {address:response.addresses[0], name:null};
			throw 'not_found';
		});
	}

	getNetworkInfo() : Promise<NetworkInfo>{
		return this.makeRpcRequest('get_last_block_header').then((raw : any)=>{
			return {
				'major_version':raw.block_header['major_version'],
				'hash':raw.block_header['hash'],
				'reward':raw.block_header['reward'],
				'height':raw.block_header['height'],
				'timestamp':raw.block_header['timestamp'],
				'difficulty':raw.block_header['difficulty']
			}
		});
	}

}