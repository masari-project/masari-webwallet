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

import {Transaction, TransactionIn, TransactionOut} from "./Transaction";
import {CryptoUtils} from "./CryptoUtils";
import has = Reflect.has;
import {UserKeys} from "./KeysRepository";
import {Wallet} from "./Wallet";


export const TX_EXTRA_PADDING_MAX_COUNT          = 255;
export const TX_EXTRA_NONCE_MAX_COUNT            = 255;

export const TX_EXTRA_TAG_PADDING                = 0x00;
export const TX_EXTRA_TAG_PUBKEY                 = 0x01;
export const TX_EXTRA_NONCE                      = 0x02;
export const TX_EXTRA_MERGE_MINING_TAG           = 0x03;
export const TX_EXTRA_MYSTERIOUS_MINERGATE_TAG   = 0xDE;


export const TX_EXTRA_NONCE_PAYMENT_ID           = 0x00;
export const TX_EXTRA_NONCE_ENCRYPTED_PAYMENT_ID = 0x01;

type TxExtra = {
	type:number,
	data:number[]
}

export class TransactionsExplorer{

	static parseExtra(oextra : number[]) : TxExtra[]{
		let extra = oextra.slice();
		let extras : TxExtra[] = [];

		// console.log('extra', oextra);
		while(extra.length > 0){
			let extraSize = 0;
			let startOffset = 0;
			if(
				extra[0] === TX_EXTRA_NONCE ||
				extra[0] === TX_EXTRA_MERGE_MINING_TAG ||
				extra[0] === TX_EXTRA_MYSTERIOUS_MINERGATE_TAG
			){
				extraSize = extra[1];
				startOffset = 2;
			}else if(extra[0] === TX_EXTRA_TAG_PUBKEY){
				extraSize = 32;
				startOffset = 1;
			}else if(extra[0] === TX_EXTRA_TAG_PADDING){
				let iExtra = 2;
				let fextras = {
					type:extra[0],
					data:[extra[1]]
				};

				while(extra.length > iExtra && extra[iExtra++] == 0) {
					fextras.data.push(0);
				}

				continue;
			}else if(extra[0] === TX_EXTRA_NONCE){
				let iExtra = 1;
				let fextras = {
					type:extra[0],
					data:[extra[1]]
				};

				while(extra.length > iExtra && extra[iExtra] == 0) {
					fextras.data.push(extra[iExtra]);
					iExtra++;
				}

				continue;
			}

			if(extraSize === 0)
				throw 'Invalid extra size'+extra[0];

			let data = extra.slice(startOffset, startOffset+extraSize);
			extras.push({
				type:extra[0],
				data:data
			});
			extra = extra.slice(startOffset+extraSize);
			// console.log(extra, extras);
		}

		return extras;
	}

	static countOuts = 0;

	static parse(rawTransaction : RawDaemonTransaction, wallet : Wallet) : Transaction|null{
		let transaction : Transaction|null = null;

			let tx_pub_key = '';
			// for (let i = 1; i < 33; ++i) {
			// 	tx_pub_key += String.fromCharCode(rawTransaction.extra[i]);
				// console.log(transaction.extra[i]+' '+String.fromCharCode(transaction.extra[i]));
			// }
			// console.log('txPubKey',tx_pub_key,tx_pub_key.length);

			let paymentId : string|null = null;

		let tx_extras = [];
		try {
				tx_extras = this.parseExtra(rawTransaction.extra);
			}catch(e){
				console.error(e);
				console.log('Error when scanning transaction on block '+rawTransaction.height, rawTransaction);
				return null;
			}
			for(let extra of tx_extras){
				if(extra.type === TX_EXTRA_TAG_PUBKEY){
					for (let i = 0; i < 32; ++i) {
						tx_pub_key += String.fromCharCode(extra.data[i]);
					}
					// break;
				}
			}

			if(tx_pub_key === '')
				throw 'MISSING TX PUB KEY';
			tx_pub_key = CryptoUtils.bintohex(tx_pub_key);

			let encryptedPaymentId : string|null = null;

			for(let extra of tx_extras){
				if(extra.type === TX_EXTRA_NONCE){
					console.log('---NONCE----', extra);
					if(extra.data[0] === TX_EXTRA_NONCE_PAYMENT_ID){
						paymentId = '';
						for (let i = 1; i < extra.data.length; ++i) {
							paymentId += String.fromCharCode(extra.data[i]);
						}
						// console.log('payment id:',CryptoUtils.bintohex(paymentId));
						paymentId = CryptoUtils.bintohex(paymentId);
					}else if(extra.data[0] === TX_EXTRA_NONCE_ENCRYPTED_PAYMENT_ID){
						encryptedPaymentId = '';
						for (let i = 1; i < extra.data.length; ++i) {
							encryptedPaymentId += String.fromCharCode(extra.data[i]);
						}
						// console.log('payment id:',CryptoUtils.bintohex(paymentId));
						let payment_id8 = CryptoUtils.bintohex(encryptedPaymentId);
						encryptedPaymentId = payment_id8;
					}
				}
			}

			// console.log('EXXTTRAA',tx_extras);
			// console.log('txPubKey',tx_pub_key,tx_pub_key.length);

			let derivation = null;
			try {
				// console.log(tx_pub_key);
				derivation = cnUtil.generate_key_derivation(tx_pub_key, wallet.keys.priv.view);//9.7ms
				// console.log(derivation);
			}catch(e){
				console.log('UNABLE TO CREATE DERIVATION', e);
				return null;
			}

			// let start = Date.now();
			// let s = cnUtil.derivation_to_scalar(derivation, 0);
			// for(let i = 0; i < 1; ++i){
			// derivation = cnUtil.generate_key_derivation(tx_pub_key, privViewKey);
			// cnUtil.derive_public_key(derivation, i,pubSpendKey);
			// cnUtil.derivation_to_scalar(derivation, 0);255/1000
			// hextobin(cnUtil.ge_scalarmult_base(s));//4563/1000
			// console.log(nacl.ll.ge_scalarmult_base(s), s);
			// }
			// let end = Date.now();
			// console.log('derivation',end-start);

			// console.log('vout',transaction.vout.length);

			this.countOuts += rawTransaction.vout.length;
			for (let iOut = 0; iOut < rawTransaction.vout.length; ++iOut) {
				let out = rawTransaction.vout[iOut];
				let txout_k = out.target;
				let amount = out.amount;
				let output_idx_in_tx = iOut;

				let generated_tx_pubkey = cnUtil.derive_public_key(derivation,
					output_idx_in_tx,
					wallet.keys.pub.spend);//5.5ms

				// check if generated public key matches the current output's key
				let mine_output = (txout_k.key == generated_tx_pubkey);

				if (mine_output) {
					let m_key_image = CryptoUtils.generate_key_image_helper({
						view_secret_key:wallet.keys.priv.view,
						spend_secret_key:wallet.keys.priv.spend,
						public_spend_key:wallet.keys.pub.spend,
					},tx_pub_key, output_idx_in_tx, derivation);

					if(transaction === null) {
						transaction = new Transaction();
						if(typeof rawTransaction.height !== 'undefined') {
							transaction.blockHeight = rawTransaction.height;
						}
						if(typeof rawTransaction.ts !== 'undefined') {
							transaction.timestamp = rawTransaction.ts;
						}
						transaction.txPubKey = tx_pub_key;

						if(paymentId !== null)
							transaction.paymentId = paymentId;
						if(encryptedPaymentId !== null){
							transaction.paymentId = cnUtil.decrypt_payment_id(encryptedPaymentId, tx_pub_key,wallet.keys.priv.view);
						}
					}else{
						//throw 'Multiple inputs for transaction';
					}

					let minerTx = false;

					if(amount !== 0){//miner tx
						minerTx = true;
					}else {
						let mask = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].mask;
						let r = CryptoUtils.decode_ringct(rawTransaction.rct_signatures,
							tx_pub_key,
							wallet.keys.priv.view,
							output_idx_in_tx,
							mask,
							amount,
							derivation);

						if (r === false)
							console.error("Cant decode ringCT!");
						else
							amount = r;
					}

					let transactionOut = new TransactionOut();
					if(typeof rawTransaction.global_index_start !== 'undefined')
						transactionOut.globalIndex = rawTransaction.global_index_start+output_idx_in_tx;
					else
						transactionOut.globalIndex = output_idx_in_tx;

					transactionOut.amount = amount;
					transactionOut.keyImage = m_key_image.key_image;
					transactionOut.pubKey = txout_k.key;
					transactionOut.ephemeralPub = m_key_image.ephemeral_pub;
					transactionOut.outputIdx = output_idx_in_tx;

					if(!minerTx) {
						transactionOut.rtcOutPk = rawTransaction.rct_signatures.outPk[output_idx_in_tx];
						transactionOut.rtcMask = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].mask;
						transactionOut.rtcAmount = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].amount;
					}
					transaction.outs.push(transactionOut);

					if(minerTx)
						break;
				} //  if (mine_output)

			}



			//TODO optimize
			//getTransactionKeyImages

			// console.log(keyImages);

			// let ins : string[] = [];
			// let sumIns = 0;

			if(transaction !== null) {
				let keyImages = wallet.getTransactionKeyImages();
				for (let iIn = 0; iIn < rawTransaction.vin.length; ++iIn) {
					let vin = rawTransaction.vin[iIn];

					// let absolute_offsets = CryptoUtils.relative_output_offsets_to_absolute(vin.key.key_offsets);
					// console.log(vin, vin.key.key_offsets, absolute_offsets);

					// let mixin_outputs = CryptoUtils.get_output_keys(vin.key.amount, absolute_offsets);
					// console.log(mixin_outputs);

					// console.log(vin.key.k_image);
					if (keyImages.indexOf(vin.key.k_image) != -1) {
						// console.log('found in', vin);
						let walletOuts = wallet.getAllOuts();
						for (let ut of walletOuts) {
							if (ut.keyImage == vin.key.k_image) {
								// ins.push(vin.key.k_image);
								// sumIns += ut.amount;

								let transactionIn = new TransactionIn();
								transactionIn.amount = ut.amount;
								transactionIn.keyImage = ut.keyImage;
								transaction.ins.push(transactionIn);
								// console.log(ut);
								break;
							}
						}
					}

					// console.log('k_image', vin.key.k_image);
				}

				if (transaction.ins.length > 0) {
					// let spend = sumIns;
					// let received = transaction.amount;
					// let pin = received;
					// let pout = spend - rawTransaction.rct_signatures.txnFee;
					// let realAmount = pin - pout;
					// transaction.amount = -realAmount;
					transaction.fees = rawTransaction.rct_signatures.txnFee;
					// transaction.received = false;
					// transaction.ins = ins;
				}
			}

		return transaction;
	}


	static createTx(targetAddress : string, amount : number, wallet : Wallet, lots_mix_outs:any[], confirmCallback : (amount:number, feesAmount:number) => Promise<void>) : Promise<string>{
		return new Promise<string>(function (resolve, reject) {
			// let explorerUrl =  config.testnet ? config.testnetExplorerUrl : config.mainnetExplorerUrl;

			// few multiplayers based on uint64_t wallet2::get_fee_multiplier
			let fee_multiplayers = [1, 4, 20, 166];

			let default_priority = 2;


			let target = cnUtil.decode_address(targetAddress);

			let feePerKB = new JSBigInt((<any>window).config.feePerKB);

			let priority = default_priority;

			let fee_multiplayer = fee_multiplayers[priority - 1]; // default is 4
			let rct = true;
			let neededFee = rct ? feePerKB.multiply(13) : feePerKB;
			let totalAmountWithoutFee;
			let pid_encrypt = false; //don't encrypt payment ID unless we find an integrated one


			totalAmountWithoutFee = new JSBigInt(0);
			totalAmountWithoutFee = totalAmountWithoutFee.add(amount);

			let payment_id = '';

			if(typeof target.intPaymentId !== 'undefined'){
				payment_id = target.intPaymentId;
				pid_encrypt = true;
			}

			/*if (payment_id)
			{
				if (payment_id.length <= 64 && /^[0-9a-fA-F]+$/.test(payment_id))
				{
					// if payment id is shorter, but has correct number, just
					// pad it to required length with zeros
					payment_id = strpad(payment_id, "0", 64);
				}

				// now double check if ok, when we padded it
				if (payment_id.length !== 64 || !(/^[0-9a-fA-F]{64}$/.test(payment_id)))
				{
					$scope.submitting = false;
					$scope.error = "The payment ID you've entered is not valid";
					return;
				}
			}*/

			if (totalAmountWithoutFee.compare(0) <= 0) {
				console.log('amount too low');
				return;
			}


			let unspentOuts = [];

			//rct=rct_outpk + rct_mask + rct_amount
			// {"amount"          , out.amount},
			// {"public_key"      , out.out_pub_key},
			// {"index"           , out.out_index},
			// {"global_index"    , out.global_index},
			// {"rct"             , rct},
			// {"tx_id"           , out.tx_id},
			// {"tx_hash"         , tx.hash},
			// {"tx_prefix_hash"  , tx.prefix_hash},
			// {"tx_pub_key"      , tx.tx_pub_key},
			// {"timestamp"       , static_cast<uint64_t>(out.timestamp)},
			// {"height"          , tx.height},
			// {"spend_key_images", json::array()}

			console.log(wallet.getAll());
			for(let tr of wallet.getAll()){
				for(let out of tr.outs){
					let rct = '';
					if(out.rtcAmount !== ''){
						rct = out.rtcOutPk+out.rtcMask+out.rtcAmount;
					}else{
						rct = cnUtil.zeroCommit(cnUtil.d2s(out.amount));
					}
					unspentOuts.push({
						keyImage:out.keyImage,
						amount:out.amount,
						public_key:out.pubKey,
						index:out.outputIdx,
						global_index:out.globalIndex,
						rct:rct,
						tx_pub_key:tr.txPubKey,
					});
				}


				// tr.keyImage

			}

			console.log('outs count before spend:', unspentOuts.length, unspentOuts);
			for(let tr of wallet.getAll().concat(wallet.txsMem)){
				console.log(tr.ins);
				for(let i of tr.ins){
					for(let iOut = 0; iOut < unspentOuts.length; ++iOut){
						let out = unspentOuts[iOut];
						let exist = out.keyImage === i.keyImage;
						if(exist){
							unspentOuts.splice(iOut, 1);
							break;
						}
					}
				}
			}

			console.log('outs available:', unspentOuts.length, unspentOuts);

			// return;
			// return;
			let using_outs : any[] = [];
			let using_outs_amount = new JSBigInt(0);
			let unused_outs = unspentOuts.slice(0);

			//TODO CHECK THIS PART
			feePerKB = new JSBigInt(config.feePerKB);
			neededFee = feePerKB.multiply(13).multiply(fee_multiplayer);

			let totalAmount = totalAmountWithoutFee.add(neededFee)/*.add(chargeAmount)*/;

			function random_index(list : any[]) {
				//TODO USE CRYPTO
				return Math.floor(Math.random() * list.length);
			}

			function pop_random_value(list : any[]) {
				let idx = random_index(list);
				let val = list[idx];
				list.splice(idx, 1);
				return val;
			}

			let dsts = [{
				address:targetAddress,
				amount:amount
			}];

			//selecting outputs to fit the desired amount (totalAmount);
			while (using_outs_amount.compare(totalAmount) < 0 && unused_outs.length > 0) {
				let out = pop_random_value(unused_outs);
				if (!rct && out.rct) {continue;} //skip rct outs if not creating rct tx
				using_outs.push(out);
				using_outs_amount = using_outs_amount.add(out.amount);
				console.log("Using output: " + out.amount + " - " + JSON.stringify(out));
			}

			let mixin = 12;
			if (using_outs.length > 1 && rct)
			{
				let newNeededFee = JSBigInt(Math.ceil(cnUtil.estimateRctSize(using_outs.length, mixin, 2) / 1024)).multiply(feePerKB).multiply(fee_multiplayer);
				totalAmount = totalAmountWithoutFee.add(newNeededFee);
				//add outputs 1 at a time till we either have them all or can meet the fee
				while (using_outs_amount.compare(totalAmount) < 0 && unused_outs.length > 0)
				{
					let out = pop_random_value(unused_outs);
					using_outs.push(out);
					using_outs_amount = using_outs_amount.add(out.amount);
					console.log("Using output: " + cnUtil.formatMoney(out.amount) + " - " + JSON.stringify(out));
					newNeededFee = JSBigInt(Math.ceil(cnUtil.estimateRctSize(using_outs.length, mixin, 2) / 1024)).multiply(feePerKB).multiply(fee_multiplayer);
					totalAmount = totalAmountWithoutFee.add(newNeededFee);
				}
				console.log("New fee: " + cnUtil.formatMoneySymbol(newNeededFee) + " for " + using_outs.length + " inputs");
				neededFee = newNeededFee;
			}

			console.log('using amount of '+using_outs_amount+' for sending '+amount+' with fees of '+(neededFee/1000000000000));


			confirmCallback(amount, neededFee).then(function(){
				if (using_outs_amount.compare(totalAmount) < 0)
				{
					console.log("Not enough spendable outputs / balance too low (have "
						+ cnUtil.formatMoneyFull(using_outs_amount) + " but need "
						+ cnUtil.formatMoneyFull(totalAmount)
						+ " (estimated fee " + cnUtil.formatMoneyFull(neededFee) + " included)");
					// return;
					reject({error:'balance_too_low'});
				}
				else if (using_outs_amount.compare(totalAmount) > 0)
				{
					let changeAmount = using_outs_amount.subtract(totalAmount);

					if (!rct)
					{   //for rct we don't presently care about dustiness
						//do not give ourselves change < dust threshold
						let changeAmountDivRem = changeAmount.divRem(config.dustThreshold);
						if (changeAmountDivRem[1].toString() !== "0") {
							// add dusty change to fee
							console.log("3) Adding change of " + cnUtil.formatMoneyFullSymbol(changeAmountDivRem[1]) + " to transaction fee (below dust threshold)");
						}
						if (changeAmountDivRem[0].toString() !== "0") {
							// send non-dusty change to our address
							let usableChange = changeAmountDivRem[0].multiply(config.dustThreshold);
							console.log("2) Sending change of " + cnUtil.formatMoneySymbol(usableChange) + " to " /*+ AccountService.getAddress()*/);
							dsts.push({
								address: wallet.getPublicAddress(),
								amount: usableChange
							});
						}
					}
					else
					{
						//add entire change for rct
						console.log("1) Sending change of " + cnUtil.formatMoneySymbol(changeAmount)
							+ " to " /*+ AccountService.getAddress()*/);
						dsts.push({
							address: wallet.getPublicAddress(),
							amount: changeAmount
						});
					}
				}
				else if (using_outs_amount.compare(totalAmount) === 0 && rct)
				{
					//create random destination to keep 2 outputs always in case of 0 change
					let fakeAddress = cnUtil.create_address(cnUtil.random_scalar()).public_addr;
					console.log("Sending 0 XMR to a fake address to keep tx uniform (no change exists): " + fakeAddress);
					dsts.push({
						address: fakeAddress,
						amount: 0
					});
				}
				console.log(dsts);

				if (mixin > 0)
				{
					let amounts = [];
					for (let l = 0; l < using_outs.length; l++)
					{
						amounts.push(using_outs[l].rct ? "0" : using_outs[l].amount.toString());
						//amounts.push("0");
					}
					let request = {
						amounts: amounts,
						count: mixin + 1 // Add one to mixin so we can skip real output key if necessary
					};

					console.log(request);

					// ApiCalls.get_random_outs(request.amounts, request.count)
					// 	.then(function(response) {
					// 		let data = response.data;
					// 		createTx(data.amount_outs);
					// 	}, function(data) {
					// 		deferred.reject('Failed to get unspent outs');
					// 	});
					let mix_outs = [];
					let mixOutsIndex = 0;
					for(let amount of amounts){
						let localMixOuts = [];

						for(let i = 0; i < request.count; ++i){
							// let randomIndex = Math.floor(Math.random()*lots_mix_outs.length);
							console.log('pushing ',lots_mix_outs[mixOutsIndex], 'for mix_out index', mixOutsIndex);
							localMixOuts.push(lots_mix_outs[mixOutsIndex]);
							++mixOutsIndex;
						}

						mix_outs.push({
							outputs:localMixOuts,
							amount:0
						});
					}
					console.log('mix_outs',mix_outs);

					createTx(mix_outs);
				} else if (mixin < 0 || isNaN(mixin)) {
					// deferred.reject("Invalid mixin");
					return;
				} else { // mixin === 0
					createTx();
				}


				//https://github.com/moneroexamples/openmonero/blob/ebf282faa8d385ef3cf97e6561bd1136c01cf210/README.md
				//https://github.com/moneroexamples/openmonero/blob/95bc207e1dd3881ba0795c02c06493861de8c705/src/YourMoneroRequests.cpp



				function createTx(mix_outs:any[]=[])
				{
					let signed;
					try {
						console.log('Destinations: ');
						cnUtil.printDsts(dsts);
						//need to get viewkey for encrypting here, because of splitting and sorting
						let realDestViewKey = undefined;
						if (pid_encrypt)
						{
							realDestViewKey = cnUtil.decode_address(dsts[0].address).view;
						}

						let splittedDsts = cnUtil.decompose_tx_destinations(dsts, rct);

						console.log('using_outs',using_outs);
						console.log('Decomposed destinations:');

						cnUtil.printDsts(splittedDsts);

						signed = cnUtil.create_transaction(
							{
								spend:wallet.keys.pub.spend,
								view:wallet.keys.pub.view
							},{
								spend:wallet.keys.priv.spend,
								view:wallet.keys.priv.view
							},
							splittedDsts, using_outs,
							mix_outs, mixin, neededFee,
							payment_id, pid_encrypt,
							realDestViewKey, 0, rct);

					} catch (e) {
						console.error("Failed to create transaction: " + e, e);
						return;
					}
					console.log("signed tx: ", JSON.stringify(signed));
					//move some stuff here to normalize rct vs non
					//if (signed.version === 1) {
					//	raw_tx_and_hash.raw = cnUtil.serialize_tx(signed);
					//	raw_tx_and_hash.hash = cnUtil.cn_fast_hash(raw_tx);
					//	raw_tx_and_hash.prvkey = signed.prvkey;
					//} else {
					let raw_tx_and_hash = cnUtil.serialize_rct_tx_with_hash(signed);
					//}
					console.log("raw_tx and hash:");
					console.log(raw_tx_and_hash);
					console.log('signed',signed);

					// let confirmTr = prompt('Confirm ? Y/n');

						resolve(raw_tx_and_hash.raw);


				}

			});

		});
	}


}