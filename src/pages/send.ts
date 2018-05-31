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
import {Url} from "../utils/Url";
import {CoinUri} from "../model/CoinUri";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
let blockchainExplorer : BlockchainExplorerRpc2 = DependencyInjectorInstance().getInstance(Constants.BLOCKCHAIN_EXPLORER);


// window.iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;



class QRReader{
	active = false;
	webcam : HTMLVideoElement|null = null;
	canvas : HTMLCanvasElement|null = null;
	ctx : CanvasRenderingContext2D|null = null;
	decoder : Worker|null = null;
	inited = false;

	setCanvas(){
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
	}

	support(){
		return typeof navigator !== 'undefined' && typeof navigator.mediaDevices !== 'undefined';
	}

	init(baseUrl : string){
		if(!this.inited)
			this.inited=true;
		else
			return;

		if(!this.support())
			return false;


		var streaming = false;
		let self = this;

		this.webcam = document.querySelector("#cameraVideoFluxForDelivery");

		this.setCanvas();
		this.decoder = new Worker(baseUrl + "decoder.min.js");

		if(this.canvas === null || this.webcam === null)
			return;

		/*if (!window.iOS) {
			// Resize webcam according to input
			this.webcam.addEventListener("play", function (ev) {
				if(self.canvas !== null)
				if (!streaming) {
					self.canvas.width = window.innerWidth;
					self.canvas.height = window.innerHeight;
					streaming = true;
				}
			}, false);
		}
		else {*/
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		// }


		function startCapture(constraints : MediaStreamConstraints) {
			navigator.mediaDevices.getUserMedia(constraints)
				.then(function (stream) {
					if(self.webcam !== null)
						self.webcam.srcObject = stream;
				})
				.catch(function(err) {
					showErrorMsg(err);
				});
		}

		// if (!window.iOS) {
			navigator.mediaDevices.enumerateDevices()
				.then(function (devices) {
					console.log(devices);
					var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
					console.log(supportedConstraints);
					var device = devices.filter(function(device) {
						var deviceLabel = device.label.split(',')[1];
						if (device.kind == "videoinput") {
							return device;
						}
					});

					if (device.length > 1) {
						var constraints = {
							facingMode: 'environment',
							video: {
								mandatory: {
									sourceId: device[1].deviceId ? device[1].deviceId : null
								}
							},
							audio: false
						};

						startCapture(<MediaStreamConstraints>constraints);
					}
					else if (device.length) {
						var constraints = {
							facingMode: 'environment',
							video: {
								mandatory: {
									sourceId: device[0].deviceId ? device[0].deviceId : null
								}
							},
							audio: false
						};

						startCapture(<MediaStreamConstraints>constraints);
					}
					else {
						startCapture({video:true});
					}
				})
				.catch(function (error) {
					showErrorMsg(error);
				});
		// }

		function showErrorMsg(error : string) {
			if(''+error === 'DOMException: Permission denied'){
				swal({
					type: 'error',
					title: 'Oops...',
					text: 'The permission to access your camera is required to scan the QR code',
				});
			}
			console.log('unable access camera');
		}
	}

	stop() {
		this.active = false;
		if (this.webcam !== null) {
			if(this.webcam.srcObject!==null)
				this.webcam.srcObject.getVideoTracks()[0].stop();
			this.webcam.srcObject = null;
		}
	}

	scan(callback : Function) {
		if(this.decoder === null)
			return;
		let self = this;

		// Start QR-decoder
		function newDecoderFrame() {
			if(self.ctx === null || self.webcam === null || self.canvas === null || self.decoder === null)
				return;

//			console.log('new frame');
			if (!self.active) return;
			try {
				self.ctx.drawImage(self.webcam, 0, 0, self.canvas.width, self.canvas.height);
				var imgData = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height);

				if (imgData.data) {
					self.decoder.postMessage(imgData);
				}
			} catch(e) {
				// Try-Catch to circumvent Firefox Bug #879717
				if (e.name == "NS_ERROR_NOT_AVAILABLE") setTimeout(newDecoderFrame, 0);
			}
		}

		this.active = true;
		this.setCanvas();
		this.decoder.onmessage = function(event) {
			if (event.data.length > 0) {
				var qrid = event.data[0][2];
				self.active = false;
				callback(qrid);
			}
			setTimeout(newDecoderFrame, 0);
		};

		newDecoderFrame();
	}
}


class SendView extends DestructableView{
	@VueVar('') destinationAddressUser : string;
	@VueVar('') destinationAddress : string;
	@VueVar(false) destinationAddressValid : boolean;
	@VueVar('10.5') amountToSend : string;
	@VueVar(false) lockedAmountToSend : boolean;
	@VueVar(true) amountToSendValid : boolean;

	@VueVar(null) domainAliasAddress : string|null;
	@VueVar(null) txDestinationName : string|null;
	@VueVar(null) txDescription : string|null;
	@VueVar(true) openAliasValid : boolean;

	@VueVar(false) qrScanning : boolean;

	qrReader : QRReader|null = null;

	constructor(container : string){
		super(container);
		let sendAddress = Url.getHashSearchParameter('address');
		console.log('==========>',sendAddress, Url.getHashSearchParameters());
		if(sendAddress !== null){
			this.destinationAddressUser = sendAddress;
		}
	}

	initQr(){
		this.stopScan();
		this.qrReader = new QRReader();
		this.qrReader.init('/lib/');
	}

	startScan(){
		this.initQr();
		if(this.qrReader) {
			let self = this;
			this.qrScanning = true;
			this.qrReader.scan(function(result : string){
				let parsed = false;
				try{
					let txDetails  = CoinUri.decodeTx(result);
					if(txDetails !== null){
						self.destinationAddressUser = txDetails.address;
						if(typeof txDetails.description !== 'undefined')self.txDescription = txDetails.description;
						if(typeof txDetails.recipientName !== 'undefined')self.txDestinationName = txDetails.recipientName;
						if(typeof txDetails.amount !== 'undefined'){
							self.amountToSend = txDetails.amount;
							self.lockedAmountToSend = true;
						}
						// if(typeof txDetails.paymentId !== 'undefined')self.paymentId = txDetails.paymentId;
						parsed = true;
					}
				}catch(e){}

				try{
					let txDetails  = CoinUri.decodeWallet(result);
					if(txDetails !== null){
						self.destinationAddressUser = txDetails.address;
						parsed = true;
					}
				}catch(e){}

				if(!parsed && result.length === CoinUri.coinAddressLength)
					self.destinationAddressUser = result;
				self.qrScanning = false;
				self.stopScan();
			});
		}
	}

	stopScan(){
		if(this.qrReader !== null){
			this.qrReader.stop();
			this.qrReader = null;
			this.qrScanning = false;
		}
	}


	destruct(): Promise<void> {
		this.stopScan();
		return super.destruct();
	}

	send(){
		let self = this;
		blockchainExplorer.getHeight().then(function(blockchainHeight:number){
			let amount = parseFloat(self.amountToSend);
			if(self.destinationAddress !== null){
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

	timeoutResolveAlias = 0;

	@VueWatched()
	destinationAddressUserWatch(){
		if(this.destinationAddressUser.indexOf('.') !== -1){
			let self = this;
			if(this.timeoutResolveAlias !== 0)
				clearTimeout(this.timeoutResolveAlias);

			this.timeoutResolveAlias = setTimeout(function(){
				blockchainExplorer.resolveOpenAlias(self.destinationAddressUser).then(function(data : {address:string,name:string|null}){
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
				}).catch(function(){
					self.openAliasValid = false;
					self.timeoutResolveAlias = 0;
				});
			}, 400);
		}else {
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
