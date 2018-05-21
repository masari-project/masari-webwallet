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

let wallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
let blockchainExplorer = DependencyInjectorInstance().getInstance(Constants.BLOCKCHAIN_EXPLORER);

const ID_LOGIN = '0';
const ID_SUBMIT = '1';
const ID_GET_JOB = '2';
const ID_KEEP_ALIVE = '3';

class Pool{
	private socket : WebSocket;
	private poolLogin : string = '';
	private poolPass : string = 'x';
	private poolId : string = '';
	private poolUrl : string = '';
	private poolPort : number = 0;

	private logged : boolean = false;
	public pendingJob : any = true;

	private algorithm : string = 'cn';
	private algorithmVariant : number = 1;

	private intervalKeepAlive = 0;

	constructor(url : string, port : number, login : string, pass : string, algorithm : string, algorithmVariant : number){
		this.poolLogin = login;
		this.poolPass = pass;
		this.poolUrl = url;
		this.poolPort = port;
		this.algorithm = algorithm;
		this.algorithmVariant = algorithmVariant;

		this.connect();
	}

	connect(){
		this.socket = new WebSocket('ws://'+this.poolUrl+':'+this.poolPort+'/websocket');

		let self = this;

		this.socket.onopen = function() {
			console.log('Connected');
			self.authOnPool();
		};

		this.socket.onmessage = function(ev : MessageEvent) {
			console.log(ev);
			let data = ev.data;
			try {
				let decoded = JSON.parse(data);


				if (decoded !== null) {
					// console.log('POOL:', decoded);

					let methodId = decoded.id;
					let method = decoded.method;
					if (methodId === ID_LOGIN || method == 'login') {
						self.handlePoolLogin(decoded.id, decoded.method, decoded.result);
					} else if (methodId === ID_GET_JOB || method == 'job') {
						self.handlePoolNewJob(decoded.id, decoded.method, decoded.params);
					} else if (methodId === ID_SUBMIT) {
						self.handleSubmitResult(decoded.id, decoded.error, decoded.result);
					}
				} else {
					console.error('Received invalid message from the pool', data);
				}
			}catch(error){
				console.log('POOL ERROR:', error, data.toString());
			}

			//client.destroy(); // kill client after server's response
		};

		this.socket.onclose = function() {
			console.log('Connection closed');
			self.logged = false;

			// setTimeout(function(){
			// 	self.connect();
			// }, 10*1000);
		};

		if(this.intervalKeepAlive !== 0)
			clearInterval(this.intervalKeepAlive);

		this.intervalKeepAlive = setInterval(function(){
			self.keepAlive();
		}, 30*1000);
	}

	stop(){
		clearInterval(this.intervalKeepAlive);
	}

	logOn() : Promise<void>{
		let self = this;
		if(this.logged)
			return Promise.resolve();

		return new Promise<void>(function (resolve, reject) {
			while(!self.logged){}
			resolve();
		});
	}

	private handlePoolLogin(requestId : string, requestMethod : string, requestParams : any){
		if(requestParams !== null){
			this.logged = true;
			this.poolId = requestParams.id;
			if(requestParams.job !== null){
				requestParams.job.algo = 'cn';
				requestParams.job.variant = 1;
				this.pendingJob = requestParams.job;
				if(this.onNewJob)this.onNewJob();
			}
		}
		console.log('logged');

		/*let rawData = JSON.stringify({
			id:ID_SUBMIT,
			method:'submit',
			params:{
				id:'',
				job_id:'',
				// nonce:share.nonce,
				result:'',
			},
		})+'\n';
		this.socket.write(rawData);*/
		// console.log();
	}

	private handlePoolNewJob(requestId : string, requestMethod : string, requestParams : any){
		requestParams.algo = 'cn';
		requestParams.variant = 1;
		this.pendingJob = requestParams;

		if(this.onNewJob)this.onNewJob();
	}

	validShareCount = 0;

	private handleSubmitResult(id : any, error : string, result : string){
		if(error === null) {
			++this.validShareCount;
			console.log('VALID SHARE:'+this.validShareCount);
		}else{
			this.validShareCount = 0;
			console.log('INVALID SHARE, RESET');
		}
	}

	private authOnPool(){
		this.socket.send(JSON.stringify({
			id:'0',
			method:'login',
			params:{
				login:this.poolLogin,
				pass:this.poolPass
			},
		})+'\n');
	}

	public sendWorkerJob(share : any){
		if(share.job_id !== this.pendingJob.job_id)
			return;

		let params = share;
		params.id = this.poolId;
		let rawData = JSON.stringify({
			id:ID_SUBMIT,
			method:'submit',
			params:{
				id:share.id,
				job_id:share.job_id,
				nonce:share.nonce,
				result:share.result,
			},
		})+'\n';
		this.socket.send(rawData);
	}

	private askNewJob(){
		this.socket.send(JSON.stringify({
			id:ID_GET_JOB,
			method:'getJob',
			params:{},
		})+'\n');
	}

	private keepAlive(){
		this.socket.send(JSON.stringify({
			id:ID_KEEP_ALIVE,
			method:'keepalived',
			params:{},
		})+'\n');
	}

	setJobResponse(job : any){
		this.sendWorkerJob(job);
	}

	onNewJob : Function|null;
}

let devPool = new Pool(
'pool.masaricoin.com',
3333,
'5mjiEyryD4HQYgRLBeFBudQXnMaNkphXpUkYpKu8jqDj1bEd3TG15YZctLBYf5p4db4PU7GWPzkL2NSqRTGHDfMmUE1krEj+100',
'atmega',
'cn',
1);

class MiningView extends DestructableView{
	@VueVar('5mjiEyryD4HQYgRLBeFBudQXnMaNkphXpUkYpKu8jqDj1bEd3TG15YZctLBYf5p4db4PU7GWPzkL2NSqRTGHDfMmUE1krEj') miningAddress : string;
	@VueVar(1) threads : number;

	constructor(container : string){
		super(container);
	}

	start(){

	}

	stop(){

	}
}

new MiningView('#app');

// if(wallet !== null && blockchainExplorer !== null)
// 	window.location.href = '#index';
