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
define(["require", "exports", "./Transaction", "./CryptoUtils", "./MathUtil"], function (require, exports, Transaction_1, CryptoUtils_1, MathUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TX_EXTRA_PADDING_MAX_COUNT = 255;
    exports.TX_EXTRA_NONCE_MAX_COUNT = 255;
    exports.TX_EXTRA_TAG_PADDING = 0x00;
    exports.TX_EXTRA_TAG_PUBKEY = 0x01;
    exports.TX_EXTRA_NONCE = 0x02;
    exports.TX_EXTRA_MERGE_MINING_TAG = 0x03;
    exports.TX_EXTRA_MYSTERIOUS_MINERGATE_TAG = 0xDE;
    exports.TX_EXTRA_NONCE_PAYMENT_ID = 0x00;
    exports.TX_EXTRA_NONCE_ENCRYPTED_PAYMENT_ID = 0x01;
    var TransactionsExplorer = /** @class */ (function () {
        function TransactionsExplorer() {
        }
        TransactionsExplorer.parseExtra = function (oextra) {
            var extra = oextra.slice();
            var extras = [];
            // console.log('extra', oextra);
            while (extra.length > 0) {
                var extraSize = 0;
                var startOffset = 0;
                if (extra[0] === exports.TX_EXTRA_NONCE ||
                    extra[0] === exports.TX_EXTRA_MERGE_MINING_TAG ||
                    extra[0] === exports.TX_EXTRA_MYSTERIOUS_MINERGATE_TAG) {
                    extraSize = extra[1];
                    startOffset = 2;
                }
                else if (extra[0] === exports.TX_EXTRA_TAG_PUBKEY) {
                    extraSize = 32;
                    startOffset = 1;
                }
                else if (extra[0] === exports.TX_EXTRA_TAG_PADDING) {
                    var iExtra = 2;
                    var fextras = {
                        type: extra[0],
                        data: [extra[1]]
                    };
                    while (extra.length > iExtra && extra[iExtra++] == 0) {
                        fextras.data.push(0);
                    }
                    continue;
                }
                else if (extra[0] === exports.TX_EXTRA_NONCE) {
                    var iExtra = 1;
                    var fextras = {
                        type: extra[0],
                        data: [extra[1]]
                    };
                    while (extra.length > iExtra && extra[iExtra] == 0) {
                        fextras.data.push(extra[iExtra]);
                        iExtra++;
                    }
                    continue;
                }
                if (extraSize === 0)
                    throw 'Invalid extra size' + extra[0];
                var data = extra.slice(startOffset, startOffset + extraSize);
                extras.push({
                    type: extra[0],
                    data: data
                });
                extra = extra.slice(startOffset + extraSize);
                // console.log(extra, extras);
            }
            return extras;
        };
        TransactionsExplorer.parse = function (rawTransaction, wallet) {
            var transaction = null;
            var tx_pub_key = '';
            // for (let i = 1; i < 33; ++i) {
            // 	tx_pub_key += String.fromCharCode(rawTransaction.extra[i]);
            // console.log(transaction.extra[i]+' '+String.fromCharCode(transaction.extra[i]));
            // }
            // console.log('txPubKey',tx_pub_key,tx_pub_key.length);
            var paymentId = null;
            var tx_extras = [];
            try {
                tx_extras = this.parseExtra(rawTransaction.extra);
            }
            catch (e) {
                console.error(e);
                console.log('Error when scanning transaction on block ' + rawTransaction.height, rawTransaction);
                return null;
            }
            for (var _i = 0, tx_extras_1 = tx_extras; _i < tx_extras_1.length; _i++) {
                var extra = tx_extras_1[_i];
                if (extra.type === exports.TX_EXTRA_TAG_PUBKEY) {
                    for (var i = 0; i < 32; ++i) {
                        tx_pub_key += String.fromCharCode(extra.data[i]);
                    }
                    // break;
                }
            }
            if (tx_pub_key === '')
                throw 'MISSING TX PUB KEY';
            tx_pub_key = CryptoUtils_1.CryptoUtils.bintohex(tx_pub_key);
            var encryptedPaymentId = null;
            for (var _a = 0, tx_extras_2 = tx_extras; _a < tx_extras_2.length; _a++) {
                var extra = tx_extras_2[_a];
                if (extra.type === exports.TX_EXTRA_NONCE) {
                    //console.log('---NONCE----', extra);
                    if (extra.data[0] === exports.TX_EXTRA_NONCE_PAYMENT_ID) {
                        paymentId = '';
                        for (var i = 1; i < extra.data.length; ++i) {
                            paymentId += String.fromCharCode(extra.data[i]);
                        }
                        // console.log('payment id:',CryptoUtils.bintohex(paymentId));
                        paymentId = CryptoUtils_1.CryptoUtils.bintohex(paymentId);
                    }
                    else if (extra.data[0] === exports.TX_EXTRA_NONCE_ENCRYPTED_PAYMENT_ID) {
                        encryptedPaymentId = '';
                        for (var i = 1; i < extra.data.length; ++i) {
                            encryptedPaymentId += String.fromCharCode(extra.data[i]);
                        }
                        // console.log('payment id:',CryptoUtils.bintohex(paymentId));
                        var payment_id8 = CryptoUtils_1.CryptoUtils.bintohex(encryptedPaymentId);
                        encryptedPaymentId = payment_id8;
                    }
                }
            }
            // console.log('EXXTTRAA',tx_extras);
            // console.log('txPubKey',tx_pub_key,tx_pub_key.length);
            var derivation = null;
            try {
                // console.log(tx_pub_key);
                derivation = cnUtil.generate_key_derivation(tx_pub_key, wallet.keys.priv.view); //9.7ms
                // console.log(derivation);
            }
            catch (e) {
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
            for (var iOut = 0; iOut < rawTransaction.vout.length; ++iOut) {
                var out = rawTransaction.vout[iOut];
                var txout_k = out.target;
                var amount = out.amount;
                var output_idx_in_tx = iOut;
                var generated_tx_pubkey = cnUtil.derive_public_key(derivation, output_idx_in_tx, wallet.keys.pub.spend); //5.5ms
                // check if generated public key matches the current output's key
                var mine_output = (txout_k.key == generated_tx_pubkey);
                if (mine_output) {
                    var m_key_image = CryptoUtils_1.CryptoUtils.generate_key_image_helper({
                        view_secret_key: wallet.keys.priv.view,
                        spend_secret_key: wallet.keys.priv.spend,
                        public_spend_key: wallet.keys.pub.spend,
                    }, tx_pub_key, output_idx_in_tx, derivation);
                    if (transaction === null) {
                        transaction = new Transaction_1.Transaction();
                        if (typeof rawTransaction.height !== 'undefined') {
                            transaction.blockHeight = rawTransaction.height;
                        }
                        if (typeof rawTransaction.ts !== 'undefined') {
                            transaction.timestamp = rawTransaction.ts;
                        }
                        transaction.txPubKey = tx_pub_key;
                        if (paymentId !== null)
                            transaction.paymentId = paymentId;
                        if (encryptedPaymentId !== null) {
                            transaction.paymentId = cnUtil.decrypt_payment_id(encryptedPaymentId, tx_pub_key, wallet.keys.priv.view);
                        }
                    }
                    else {
                        //throw 'Multiple inputs for transaction';
                    }
                    var minerTx = false;
                    if (amount !== 0) {
                        minerTx = true;
                    }
                    else {
                        var mask = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].mask;
                        var r = CryptoUtils_1.CryptoUtils.decode_ringct(rawTransaction.rct_signatures, tx_pub_key, wallet.keys.priv.view, output_idx_in_tx, mask, amount, derivation);
                        if (r === false)
                            console.error("Cant decode ringCT!");
                        else
                            amount = r;
                    }
                    var transactionOut = new Transaction_1.TransactionOut();
                    if (typeof rawTransaction.global_index_start !== 'undefined')
                        transactionOut.globalIndex = rawTransaction.global_index_start + output_idx_in_tx;
                    else
                        transactionOut.globalIndex = output_idx_in_tx;
                    transactionOut.amount = amount;
                    transactionOut.keyImage = m_key_image.key_image;
                    transactionOut.pubKey = txout_k.key;
                    transactionOut.ephemeralPub = m_key_image.ephemeral_pub;
                    transactionOut.outputIdx = output_idx_in_tx;
                    if (!minerTx) {
                        transactionOut.rtcOutPk = rawTransaction.rct_signatures.outPk[output_idx_in_tx];
                        transactionOut.rtcMask = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].mask;
                        transactionOut.rtcAmount = rawTransaction.rct_signatures.ecdhInfo[output_idx_in_tx].amount;
                    }
                    transaction.outs.push(transactionOut);
                    if (minerTx)
                        break;
                } //  if (mine_output)
            }
            if (transaction !== null) {
                var keyImages = wallet.getTransactionKeyImages();
                for (var iIn = 0; iIn < rawTransaction.vin.length; ++iIn) {
                    var vin = rawTransaction.vin[iIn];
                    // let absolute_offsets = CryptoUtils.relative_output_offsets_to_absolute(vin.key.key_offsets);
                    // console.log(vin, vin.key.key_offsets, absolute_offsets);
                    // let mixin_outputs = CryptoUtils.get_output_keys(vin.key.amount, absolute_offsets);
                    // console.log(mixin_outputs);
                    // console.log(vin.key.k_image);
                    if (keyImages.indexOf(vin.key.k_image) != -1) {
                        // console.log('found in', vin);
                        var walletOuts = wallet.getAllOuts();
                        for (var _b = 0, walletOuts_1 = walletOuts; _b < walletOuts_1.length; _b++) {
                            var ut = walletOuts_1[_b];
                            if (ut.keyImage == vin.key.k_image) {
                                // ins.push(vin.key.k_image);
                                // sumIns += ut.amount;
                                var transactionIn = new Transaction_1.TransactionIn();
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
        };
        TransactionsExplorer.formatWalletOutsForTx = function (wallet, blockchainHeight) {
            var unspentOuts = [];
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
            for (var _i = 0, _a = wallet.getAll(); _i < _a.length; _i++) {
                var tr = _a[_i];
                //todo improve to take into account miner tx
                //only add outs unlocked
                if (!tr.isConfirmed(blockchainHeight)) {
                    continue;
                }
                for (var _b = 0, _c = tr.outs; _b < _c.length; _b++) {
                    var out = _c[_b];
                    var rct = '';
                    if (out.rtcAmount !== '') {
                        rct = out.rtcOutPk + out.rtcMask + out.rtcAmount;
                    }
                    else {
                        rct = cnUtil.zeroCommit(cnUtil.d2s(out.amount));
                    }
                    unspentOuts.push({
                        keyImage: out.keyImage,
                        amount: out.amount,
                        public_key: out.pubKey,
                        index: out.outputIdx,
                        global_index: out.globalIndex,
                        rct: rct,
                        tx_pub_key: tr.txPubKey,
                    });
                }
            }
            console.log('outs count before spend:', unspentOuts.length, unspentOuts);
            for (var _d = 0, _e = wallet.getAll().concat(wallet.txsMem); _d < _e.length; _d++) {
                var tr = _e[_d];
                console.log(tr.ins);
                for (var _f = 0, _g = tr.ins; _f < _g.length; _f++) {
                    var i = _g[_f];
                    for (var iOut = 0; iOut < unspentOuts.length; ++iOut) {
                        var out = unspentOuts[iOut];
                        var exist = out.keyImage === i.keyImage;
                        if (exist) {
                            unspentOuts.splice(iOut, 1);
                            break;
                        }
                    }
                }
            }
            return unspentOuts;
        };
        TransactionsExplorer.createRawTx = function (dsts, wallet, rct, usingOuts, pid_encrypt, mix_outs, mixin, neededFee, payment_id) {
            if (mix_outs === void 0) { mix_outs = []; }
            return new Promise(function (resolve, reject) {
                var signed;
                try {
                    console.log('Destinations: ');
                    //need to get viewkey for encrypting here, because of splitting and sorting
                    var realDestViewKey = undefined;
                    if (pid_encrypt) {
                        realDestViewKey = cnUtil.decode_address(dsts[0].address).view;
                    }
                    var splittedDsts = cnUtil.decompose_tx_destinations(dsts, rct);
                    signed = cnUtil.create_transaction({
                        spend: wallet.keys.pub.spend,
                        view: wallet.keys.pub.view
                    }, {
                        spend: wallet.keys.priv.spend,
                        view: wallet.keys.priv.view
                    }, splittedDsts, usingOuts, mix_outs, mixin, neededFee, payment_id, pid_encrypt, realDestViewKey, 0, rct);
                }
                catch (e) {
                    reject("Failed to create transaction: " + e);
                }
                console.log("signed tx: ", signed);
                var raw_tx_and_hash = cnUtil.serialize_rct_tx_with_hash(signed);
                resolve({ raw: raw_tx_and_hash.raw, signed: signed });
            });
        };
        TransactionsExplorer.createTx = function (userDestinations, userPaymentId, wallet, blockchainHeight, lots_mix_outs, confirmCallback) {
            if (userPaymentId === void 0) { userPaymentId = ''; }
            return new Promise(function (resolve, reject) {
                // few multiplayers based on uint64_t wallet2::get_fee_multiplier
                var fee_multiplayers = [1, 4, 20, 166];
                var default_priority = 2;
                var feePerKB = new JSBigInt(window.config.feePerKB);
                var priority = default_priority;
                var fee_multiplayer = fee_multiplayers[priority - 1];
                var mixin = 12;
                var neededFee = feePerKB.multiply(13);
                var pid_encrypt = false; //don't encrypt payment ID unless we find an integrated one
                var totalAmountWithoutFee = new JSBigInt(0);
                var paymentIdIncluded = 0;
                var paymentId = '';
                var dsts = [];
                for (var _i = 0, userDestinations_1 = userDestinations; _i < userDestinations_1.length; _i++) {
                    var dest = userDestinations_1[_i];
                    totalAmountWithoutFee = totalAmountWithoutFee.add(dest.amount);
                    var target = cnUtil.decode_address(dest.address);
                    if (typeof target.intPaymentId !== 'undefined') {
                        ++paymentIdIncluded;
                        paymentId = target.intPaymentId;
                        pid_encrypt = true;
                    }
                    dsts.push(dest);
                }
                if (paymentIdIncluded > 1) {
                    reject('multiple_payment_ids');
                    return;
                }
                if (paymentId !== '' && userPaymentId !== '') {
                    reject('address_payment_id_conflict_user_payment_id');
                    return;
                }
                if (totalAmountWithoutFee.compare(0) <= 0) {
                    reject('negative_amount');
                    return;
                }
                if (paymentId === '' && userPaymentId !== '') {
                    if (userPaymentId.length <= 16 && /^[0-9a-fA-F]+$/.test(userPaymentId)) {
                        userPaymentId = ('0000000000000000' + userPaymentId).slice(-16);
                    }
                    // now double check if ok
                    if (userPaymentId.length !== 16 || !(/^[0-9a-fA-F]{16}$/.test(userPaymentId))) {
                        reject('invalid_payment_id');
                        return;
                    }
                }
                var unspentOuts = TransactionsExplorer.formatWalletOutsForTx(wallet, blockchainHeight);
                console.log('outs available:', unspentOuts.length, unspentOuts);
                var usingOuts = [];
                var usingOuts_amount = new JSBigInt(0);
                var unusedOuts = unspentOuts.slice(0);
                var totalAmount = totalAmountWithoutFee.add(neededFee) /*.add(chargeAmount)*/;
                //selecting outputs to fit the desired amount (totalAmount);
                function pop_random_value(list) {
                    var idx = Math.floor(MathUtil_1.MathUtil.randomFloat() * list.length);
                    var val = list[idx];
                    list.splice(idx, 1);
                    return val;
                }
                while (usingOuts_amount.compare(totalAmount) < 0 && unusedOuts.length > 0) {
                    var out = pop_random_value(unusedOuts);
                    usingOuts.push(out);
                    usingOuts_amount = usingOuts_amount.add(out.amount);
                    console.log("Using output: " + out.amount + " - " + JSON.stringify(out));
                }
                console.log("Selected outs:", usingOuts);
                if (usingOuts.length >= 1) {
                    var newNeededFee = JSBigInt(Math.ceil(cnUtil.estimateRctSize(usingOuts.length, mixin, 2) / 1024)).multiply(feePerKB).multiply(fee_multiplayer);
                    totalAmount = totalAmountWithoutFee.add(newNeededFee);
                    //add outputs 1 at a time till we either have them all or can meet the fee
                    while (usingOuts_amount.compare(totalAmount) < 0 && unusedOuts.length > 0) {
                        var out = pop_random_value(unusedOuts);
                        usingOuts.push(out);
                        usingOuts_amount = usingOuts_amount.add(out.amount);
                        console.log("Using output: " + cnUtil.formatMoney(out.amount) + " - " + JSON.stringify(out));
                        newNeededFee = JSBigInt(Math.ceil(cnUtil.estimateRctSize(usingOuts.length, mixin, 2) / 1024)).multiply(feePerKB).multiply(fee_multiplayer);
                        totalAmount = totalAmountWithoutFee.add(newNeededFee);
                    }
                    console.log("New fee: " + cnUtil.formatMoneySymbol(newNeededFee) + " for " + usingOuts.length + " inputs");
                    neededFee = newNeededFee;
                }
                console.log('using amount of ' + usingOuts_amount + ' for sending ' + totalAmountWithoutFee + ' with fees of ' + (neededFee / 1000000000000));
                confirmCallback(totalAmountWithoutFee, neededFee).then(function () {
                    if (usingOuts_amount.compare(totalAmount) < 0) {
                        console.log("Not enough spendable outputs / balance too low (have "
                            + cnUtil.formatMoneyFull(usingOuts_amount) + " but need "
                            + cnUtil.formatMoneyFull(totalAmount)
                            + " (estimated fee " + cnUtil.formatMoneyFull(neededFee) + " included)");
                        // return;
                        reject({ error: 'balance_too_low' });
                        return;
                    }
                    else if (usingOuts_amount.compare(totalAmount) > 0) {
                        var changeAmount = usingOuts_amount.subtract(totalAmount);
                        //add entire change for rct
                        console.log("1) Sending change of " + cnUtil.formatMoneySymbol(changeAmount)
                            + " to " /*+ AccountService.getAddress()*/);
                        dsts.push({
                            address: wallet.getPublicAddress(),
                            amount: changeAmount
                        });
                    }
                    else if (usingOuts_amount.compare(totalAmount) === 0) {
                        //create random destination to keep 2 outputs always in case of 0 change
                        var fakeAddress = cnUtil.create_address(cnUtil.random_scalar()).public_addr;
                        console.log("Sending 0 XMR to a fake address to keep tx uniform (no change exists): " + fakeAddress);
                        dsts.push({
                            address: fakeAddress,
                            amount: 0
                        });
                    }
                    console.log(dsts);
                    var amounts = [];
                    for (var l = 0; l < usingOuts.length; l++) {
                        amounts.push(usingOuts[l].rct ? "0" : usingOuts[l].amount.toString());
                    }
                    var mix_outs = [];
                    var mixOutsIndexes = [];
                    for (var i = 0; i < amounts.length * (mixin + 1); ++i) {
                        var index = parseInt('' + (MathUtil_1.MathUtil.randomFloat() * lots_mix_outs.length));
                        while (mixOutsIndexes.indexOf(index) !== -1)
                            index = parseInt('' + (MathUtil_1.MathUtil.randomFloat() * lots_mix_outs.length));
                        mixOutsIndexes.push(index);
                    }
                    mixOutsIndexes.sort();
                    var iMixOutsIndexes = 0;
                    for (var _i = 0, amounts_1 = amounts; _i < amounts_1.length; _i++) {
                        var amount = amounts_1[_i];
                        var localMixOuts = [];
                        for (var i = 0; i < mixin + 1; ++i) {
                            localMixOuts.push(lots_mix_outs[iMixOutsIndexes]);
                            ++iMixOutsIndexes;
                        }
                        mix_outs.push({
                            outputs: localMixOuts,
                            amount: 0
                        });
                    }
                    console.log('mix_outs', mix_outs);
                    TransactionsExplorer.createRawTx(dsts, wallet, true, usingOuts, pid_encrypt, mix_outs, mixin, neededFee, paymentId).then(function (data) {
                        resolve(data);
                    }).catch(function (e) {
                        reject(e);
                    });
                    //https://github.com/moneroexamples/openmonero/blob/ebf282faa8d385ef3cf97e6561bd1136c01cf210/README.md
                    //https://github.com/moneroexamples/openmonero/blob/95bc207e1dd3881ba0795c02c06493861de8c705/src/YourMoneroRequests.cpp
                });
            });
        };
        TransactionsExplorer.countOuts = 0;
        return TransactionsExplorer;
    }());
    exports.TransactionsExplorer = TransactionsExplorer;
});
//# sourceMappingURL=TransactionsExplorer.js.map