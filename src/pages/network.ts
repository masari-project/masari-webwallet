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
import {VueVar} from "../lib/numbersLab/VueAnnotate";
import {TransactionsExplorer} from "../model/TransactionsExplorer";
import {WalletRepository} from "../model/WalletRepository";
import {BlockchainExplorerRpc2} from "../model/blockchain/BlockchainExplorerRpc2";
import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Constants} from "../model/Constants";
import {Wallet} from "../model/Wallet";
import {AppState} from "../model/AppState";

AppState.enableLeftMenu();

class NetworkView extends DestructableView{
	@VueVar(0) networkHashrate !: number;
	@VueVar(0) blockchainHeight !: number;
	@VueVar(0) networkDifficulty !: number;
	@VueVar(0) lastReward !: number;
	@VueVar(0) lastBlockFound !: number;

	private intervalRefreshStat = 0;

	constructor(container : string){
		super(container);

		let self = this;
		this.intervalRefreshStat = setInterval(function(){
			self.refreshStats();
		}, 30*1000);
		this.refreshStats();
	}

	destruct(): Promise<void> {
		clearInterval(this.intervalRefreshStat);
		return super.destruct();
	}

	refreshStats() {
		let self = this;
		$.ajax({
			url:config.apiUrl+'network.php'
		}).done(function(data : any){
			self.networkDifficulty = data.difficulty;
			self.networkHashrate = data.difficulty/config.avgBlockTime/1000000;
			self.blockchainHeight = data.height;
			self.lastReward = data.reward/Math.pow(10, config.coinUnitPlaces);
			self.lastBlockFound = parseInt(data.timestamp);
		});
	}

}

new NetworkView('#app');