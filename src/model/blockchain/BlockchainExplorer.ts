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

import {Wallet} from "../Wallet";
import {CnTransactions} from "../Cn";

/*
export type RawDaemon_RctSignature = {
	ecdhInfo:EcdhInfo[]
	outPk:string[],
	psuedoOuts:string[],
	txnFee:number,
	type:number
}
*/

export type RawDaemon_Transaction = {
	extra : number[],
	vout : CnTransactions.Vout[],
	vin : {
		key?:CnTransactions.Vin,
		gen?:{height:number},
	}[],
	rct_signatures:CnTransactions.RctSignature,
	unlock_time:number,
	version:number,
	ctsig_prunable:any,
	global_index_start?:number,
	height?:number,
	ts?:number,//timestamp
	hash?:string,
};

export type NetworkInfo = {
	major_version:number,
	hash:string,
	reward:number,
	height:number,
	timestamp:number,
	difficulty:number,
};

export interface BlockchainExplorer{
	resolveOpenAlias(str : string) : Promise<{ address: string, name: string | null }>;
	getHeight() : Promise<number>;
	getScannedHeight() : number;
	watchdog(wallet : Wallet) : void;
	getTransactionPool() : Promise<RawDaemon_Transaction[]>;
	getTransactionsForBlocks(startBlock : number, endBlock : number, includeMinerTx : boolean) : Promise<RawDaemon_Transaction[]>;
	sendRawTx(rawTx : string) : Promise<any>;
	getRandomOuts(numberOuts : number) : Promise<any[]>;
	getNetworkInfo() : Promise<NetworkInfo>;
}