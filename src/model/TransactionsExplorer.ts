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
import {MathUtil} from "./MathUtil";


export const TX_EXTRA_PADDING_MAX_COUNT          = 255;
export const TX_EXTRA_NONCE_MAX_COUNT            = 255;

export const TX_EXTRA_TAG_PADDING                = 0x00;
export const TX_EXTRA_TAG_PUBKEY                 = 0x01;
export const TX_EXTRA_NONCE                      = 0x02;
export const TX_EXTRA_MERGE_MINING_TAG           = 0x03;
export const TX_EXTRA_MYSTERIOUS_MINERGATE_TAG   = 0xDE;


export const TX_EXTRA_NONCE_PAYMENT_ID           = 0x00;
export const TX_EXTRA_NONCE_ENCRYPTED_PAYMENT_ID = 0x01;

type RawOutForTx = {
	keyImage:string,
	amount:number,
	public_key:string,
	index:number,
	global_index:number,
	rct:string,
	tx_pub_key:string,
};

type TxExtra = {
	type:number,
	data:number[]
};

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

	static isMinerTx(rawTransaction : RawDaemonTransaction){
		if(rawTransaction.vin.length > 0)
			return false;
		return rawTransaction.vout[0].amount !== 0;
	}

	static parse(rawTransaction : RawDaemonTransaction, wallet : Wallet) : Transaction|null{
		let transaction : Transaction|null = null;

		let tx_pub_key = '';
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
				break;
			}
		}

		if(tx_pub_key === '')
			throw 'MISSING TX PUB KEY';
		tx_pub_key = CryptoUtils.bintohex(tx_pub_key);

		let encryptedPaymentId : string|null = null;

		for(let extra of tx_extras){
			if(extra.type === TX_EXTRA_NONCE){
				if(extra.data[0] === TX_EXTRA_NONCE_PAYMENT_ID){
					paymentId = '';
					for (let i = 1; i < extra.data.length; ++i) {
						paymentId += String.fromCharCode(extra.data[i]);
					}
					paymentId = CryptoUtils.bintohex(paymentId);
				}else if(extra.data[0] === TX_EXTRA_NONCE_ENCRYPTED_PAYMENT_ID){
					encryptedPaymentId = '';
					for (let i = 1; i < extra.data.length; ++i) {
						encryptedPaymentId += String.fromCharCode(extra.data[i]);
					}
					encryptedPaymentId = CryptoUtils.bintohex(encryptedPaymentId);
				}
			}
		}

		let derivation = null;
		try {
			derivation = cnUtil.generate_key_derivation(tx_pub_key, wallet.keys.priv.view);//9.7ms
		}catch(e){
			console.log('UNABLE TO CREATE DERIVATION', e);
			return null;
		}

		let outs : TransactionOut[] = [];
		let ins : TransactionIn[] = [];

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
				transactionOut.pubKey = txout_k.key;
				transactionOut.outputIdx = output_idx_in_tx;

				if(!minerTx) {
					transactionOut.rtcOutPk = rawTransaction.rct_signatures.outPk[output_idx_in_tx];
					transactionOut.rtcMask = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].mask;
					transactionOut.rtcAmount = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].amount;
				}

				if(wallet.keys.priv.spend !== null && wallet.keys.priv.spend !== '') {
					let m_key_image = CryptoUtils.generate_key_image_helper({
						view_secret_key: wallet.keys.priv.view,
						spend_secret_key: wallet.keys.priv.spend,
						public_spend_key: wallet.keys.pub.spend,
					}, tx_pub_key, output_idx_in_tx, derivation);

					transactionOut.keyImage = m_key_image.key_image;
					transactionOut.ephemeralPub = m_key_image.ephemeral_pub;
				}

				outs.push(transactionOut);

				if(minerTx)
					break;
			} //  if (mine_output)
		}

		//check if no read only wallet
		if(wallet.keys.priv.spend !== null && wallet.keys.priv.spend !== '') {
			let keyImages = wallet.getTransactionKeyImages();
			for (let iIn = 0; iIn < rawTransaction.vin.length; ++iIn) {
				let vin = rawTransaction.vin[iIn];
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

							ins.push(transactionIn);
							// console.log(ut);
							break;
						}
					}
				}
			}
		}else{
			let txOutIndexes = wallet.getTransactionOutIndexes();
			for (let iIn = 0; iIn < rawTransaction.vin.length; ++iIn) {
				let vin = rawTransaction.vin[iIn];

				let absoluteOffets = vin.key.key_offsets.slice();
				for (let i = 1; i < absoluteOffets.length; ++i) {
					absoluteOffets[i] += absoluteOffets[i - 1];
				}

				let ownTx = -1;
				for (let index of absoluteOffets) {
					if (txOutIndexes.indexOf(index) !== -1) {
						ownTx = index;
						break;
					}
				}

				if (ownTx !== -1) {
					let txOut = wallet.getOutWithGlobalIndex(ownTx);
					if (txOut !== null) {
						let transactionIn = new TransactionIn();
						transactionIn.amount = -txOut.amount;
						transactionIn.keyImage = txOut.keyImage;

						ins.push(transactionIn);
					}
				}
			}
		}

		if(outs.length > 0 || ins.length){
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
			transaction.fees = rawTransaction.rct_signatures.txnFee;
			transaction.outs = outs;
			transaction.ins = ins;
		}


		return transaction;
	}


	static formatWalletOutsForTx(wallet : Wallet, blockchainHeight : number) : RawOutForTx[] {
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
			//todo improve to take into account miner tx
			//only add outs unlocked
			if(!tr.isConfirmed(blockchainHeight)){
				continue;
			}

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

		return unspentOuts;
	}

	static createRawTx(
		dsts : {address:string,amount:number}[],
		wallet: Wallet,
		rct : boolean,
		usingOuts : RawOutForTx[],
		pid_encrypt:boolean,
		mix_outs:any[]=[],
		mixin:number,
		neededFee:number,
		payment_id:string
	) : Promise<{raw:{hash:string,prvKey:string,raw:string},signed:any}>
	{
		return new Promise<{raw:{hash:string,prvKey:string,raw:string},signed:any}>(function(resolve, reject) {
			let signed;
			try {
				console.log('Destinations: ');
				//need to get viewkey for encrypting here, because of splitting and sorting
				let realDestViewKey = undefined;
				if (pid_encrypt) {
					realDestViewKey = cnUtil.decode_address(dsts[0].address).view;
				}

				let splittedDsts = cnUtil.decompose_tx_destinations(dsts, rct);
				signed = cnUtil.create_transaction(
					{
						spend: wallet.keys.pub.spend,
						view: wallet.keys.pub.view
					}, {
						spend: wallet.keys.priv.spend,
						view: wallet.keys.priv.view
					},
					splittedDsts, usingOuts,
					mix_outs, mixin, neededFee,
					payment_id, pid_encrypt,
					realDestViewKey, 0, rct);

			} catch (e) {
				reject("Failed to create transaction: " + e);
			}
			console.log("signed tx: ", signed);
			let raw_tx_and_hash = cnUtil.serialize_rct_tx_with_hash(signed);
			resolve({raw:raw_tx_and_hash, signed:signed});
		});
	}

	static createTx(
		userDestinations : {address : string, amount : number}[],
		userPaymentId:string='',
		wallet : Wallet,
		blockchainHeight : number,
		obtainMixOutsCallback : (quantity:number) => Promise<any[]>,
		confirmCallback : (amount:number, feesAmount:number) => Promise<void>) :
		Promise<{raw:{hash:string,prvKey:string,raw:string},signed:any}>
	{
		return new Promise<{raw:{hash:string,prvKey:string,raw:string},signed:any}>(function (resolve, reject) {
			// few multiplayers based on uint64_t wallet2::get_fee_multiplier
			let fee_multiplayers = [1, 4, 20, 166];
			let default_priority = 2;
			let feePerKB = new JSBigInt((<any>window).config.feePerKB);
			let priority = default_priority;
			let fee_multiplayer = fee_multiplayers[priority - 1];
			let mixin = 12;
			let neededFee = feePerKB.multiply(13).multiply(fee_multiplayer);
			let pid_encrypt = false; //don't encrypt payment ID unless we find an integrated one

			let totalAmountWithoutFee = new JSBigInt(0);
			let paymentIdIncluded = 0;

			let paymentId = '';
			let dsts : {address:string,amount:number}[] = [];

			for(let dest of userDestinations) {
				totalAmountWithoutFee = totalAmountWithoutFee.add(dest.amount);
				let target = cnUtil.decode_address(dest.address);
				if(typeof target.intPaymentId !== 'undefined'){
					++paymentIdIncluded;
					paymentId = target.intPaymentId;
					pid_encrypt = true;
				}
				dsts.push(dest);
			}

			if(paymentIdIncluded > 1) {
				reject('multiple_payment_ids');return;
			}

			if(paymentId !== '' && userPaymentId !== ''){
				reject('address_payment_id_conflict_user_payment_id');return;
			}

			if (totalAmountWithoutFee.compare(0) <= 0) {
				reject('negative_amount');return;
			}

			if(paymentId === '' && userPaymentId !== ''){
				if (userPaymentId.length <= 16 && /^[0-9a-fA-F]+$/.test(userPaymentId)) {
					userPaymentId = ('0000000000000000'+userPaymentId).slice(-16);
				}
				// now double check if ok
				if (
					(userPaymentId.length !== 16 && userPaymentId.length !== 64) ||
					(!(/^[0-9a-fA-F]{16}$/.test(userPaymentId)) && !(/^[0-9a-fA-F]{64}$/.test(userPaymentId)))
				) {
					reject('invalid_payment_id');
					return;
				}

				pid_encrypt = userPaymentId.length === 16;
				paymentId = userPaymentId;
			}


			let unspentOuts : RawOutForTx[] = TransactionsExplorer.formatWalletOutsForTx(wallet, blockchainHeight);

			console.log('outs available:', unspentOuts.length, unspentOuts);

			let usingOuts : RawOutForTx[] = [];
			let usingOuts_amount = new JSBigInt(0);
			let unusedOuts = unspentOuts.slice(0);

			let totalAmount = totalAmountWithoutFee.add(neededFee)/*.add(chargeAmount)*/;

			//selecting outputs to fit the desired amount (totalAmount);
			function pop_random_value(list : any[]) {
				let idx = Math.floor(MathUtil.randomFloat() * list.length);
				let val = list[idx];
				list.splice(idx, 1);
				return val;
			}
			while (usingOuts_amount.compare(totalAmount) < 0 && unusedOuts.length > 0) {
				let out = pop_random_value(unusedOuts);
				usingOuts.push(out);
				usingOuts_amount = usingOuts_amount.add(out.amount);
				console.log("Using output: " + out.amount + " - " + JSON.stringify(out));
			}

			const calculateFeeWithBytes = function(fee_per_kb : number, bytes : number, fee_multiplier : number){
				let kB = (bytes + 1023) / 1024;
				return kB * fee_per_kb * fee_multiplier;
			};

			console.log("Selected outs:",usingOuts);
			if (usingOuts.length > 1) {
				let newNeededFee = JSBigInt(Math.ceil(cnUtil.estimateRctSize(usingOuts.length, mixin, 2) / 1024)).multiply(feePerKB).multiply(fee_multiplayer);
				totalAmount = totalAmountWithoutFee.add(newNeededFee);
				//add outputs 1 at a time till we either have them all or can meet the fee
				while (usingOuts_amount.compare(totalAmount) < 0 && unusedOuts.length > 0)
				{
					let out = pop_random_value(unusedOuts);
					usingOuts.push(out);
					usingOuts_amount = usingOuts_amount.add(out.amount);
					console.log("Using output: " + cnUtil.formatMoney(out.amount) + " - " + JSON.stringify(out));
					newNeededFee = JSBigInt(Math.ceil(cnUtil.estimateRctSize(usingOuts.length, mixin, 2) / 1024)).multiply(feePerKB).multiply(fee_multiplayer);
					totalAmount = totalAmountWithoutFee.add(newNeededFee);
				}
				console.log("New fee: " + cnUtil.formatMoneySymbol(newNeededFee) + " for " + usingOuts.length + " inputs");
				neededFee = newNeededFee;
			}

			console.log('using amount of '+usingOuts_amount+' for sending '+totalAmountWithoutFee+' with fees of '+(neededFee/1000000000000));
			confirmCallback(totalAmountWithoutFee, neededFee).then(function(){
				if (usingOuts_amount.compare(totalAmount) < 0){
					console.log("Not enough spendable outputs / balance too low (have "
						+ cnUtil.formatMoneyFull(usingOuts_amount) + " but need "
						+ cnUtil.formatMoneyFull(totalAmount)
						+ " (estimated fee " + cnUtil.formatMoneyFull(neededFee) + " included)");
					// return;
					reject({error:'balance_too_low'});return;
				}
				else if (usingOuts_amount.compare(totalAmount) > 0){
					let changeAmount = usingOuts_amount.subtract(totalAmount);
						//add entire change for rct
						console.log("1) Sending change of " + cnUtil.formatMoneySymbol(changeAmount)
							+ " to " /*+ AccountService.getAddress()*/);
						dsts.push({
							address: wallet.getPublicAddress(),
							amount: changeAmount
						});
				}
				else if (usingOuts_amount.compare(totalAmount) === 0){
					//create random destination to keep 2 outputs always in case of 0 change
					let fakeAddress = cnUtil.create_address(cnUtil.random_scalar()).public_addr;
					console.log("Sending 0 XMR to a fake address to keep tx uniform (no change exists): " + fakeAddress);
					dsts.push({
						address: fakeAddress,
						amount: 0
					});
				}
				console.log('destinations',dsts);

				let amounts : string[] = [];
				for (let l = 0; l < usingOuts.length; l++) {
					amounts.push(usingOuts[l].rct ? "0" : usingOuts[l].amount.toString());
				}

				obtainMixOutsCallback(amounts.length*(mixin+1)).then(function(lotsMixOuts : any[]){
					console.log('------------------------------mix_outs',lotsMixOuts);
					console.log('amounts',amounts);
					console.log('lots_mix_outs',lotsMixOuts);

					let mix_outs = [];
					let iMixOutsIndexes = 0;
					for(let amount of amounts){
						let localMixOuts = [];
						for(let i = 0; i < mixin + 1 ; ++i){
							localMixOuts.push(lotsMixOuts[iMixOutsIndexes]);
							++iMixOutsIndexes;
						}
						mix_outs.push({
							outputs:localMixOuts,
							amount:0
						});

					}
					console.log('mix_outs',mix_outs);

					TransactionsExplorer.createRawTx(dsts,wallet,true, usingOuts,pid_encrypt,mix_outs,mixin,neededFee,paymentId).then(function(data : {raw:{hash:string,prvKey:string,raw:string},signed:any}){
						resolve(data);
					}).catch(function(e){
						reject(e);
					});
				});

				//https://github.com/moneroexamples/openmonero/blob/ebf282faa8d385ef3cf97e6561bd1136c01cf210/README.md
				//https://github.com/moneroexamples/openmonero/blob/95bc207e1dd3881ba0795c02c06493861de8c705/src/YourMoneroRequests.cpp

			});

		});
	}


}