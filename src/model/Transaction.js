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
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TransactionOut = /** @class */ (function () {
        function TransactionOut() {
            this.amount = 0;
            this.keyImage = '';
            this.outputIdx = 0;
            this.globalIndex = 0;
            this.ephemeralPub = '';
            this.pubKey = '';
            this.rtcOutPk = '';
            this.rtcMask = '';
            this.rtcAmount = '';
        }
        TransactionOut.fromRaw = function (raw) {
            var nout = new TransactionOut();
            nout.keyImage = raw.keyImage;
            nout.outputIdx = raw.outputIdx;
            nout.globalIndex = raw.globalIndex;
            nout.amount = raw.amount;
            if (typeof raw.ephemeralPub !== 'undefined')
                nout.ephemeralPub = raw.ephemeralPub;
            if (typeof raw.pubKey !== 'undefined')
                nout.pubKey = raw.pubKey;
            if (typeof raw.rtcOutPk !== 'undefined')
                nout.rtcOutPk = raw.rtcOutPk;
            if (typeof raw.rtcMask !== 'undefined')
                nout.rtcMask = raw.rtcMask;
            if (typeof raw.rtcAmount !== 'undefined')
                nout.rtcAmount = raw.rtcAmount;
            return nout;
        };
        TransactionOut.prototype.export = function () {
            var data = {
                keyImage: this.keyImage,
                outputIdx: this.outputIdx,
                globalIndex: this.globalIndex,
                amount: this.amount,
            };
            if (this.rtcOutPk !== '')
                data.rtcOutPk = this.rtcOutPk;
            if (this.rtcMask !== '')
                data.rtcMask = this.rtcMask;
            if (this.rtcAmount !== '')
                data.rtcAmount = this.rtcAmount;
            if (this.ephemeralPub !== '')
                data.ephemeralPub = this.ephemeralPub;
            if (this.pubKey !== '')
                data.pubKey = this.pubKey;
            return data;
        };
        return TransactionOut;
    }());
    exports.TransactionOut = TransactionOut;
    var TransactionIn = /** @class */ (function () {
        function TransactionIn() {
            this.keyImage = '';
            this.amount = 0;
        }
        TransactionIn.fromRaw = function (raw) {
            var nin = new TransactionIn();
            nin.keyImage = raw.keyImage;
            nin.amount = raw.amount;
            return nin;
        };
        TransactionIn.prototype.export = function () {
            return {
                keyImage: this.keyImage,
                amount: this.amount,
            };
        };
        return TransactionIn;
    }());
    exports.TransactionIn = TransactionIn;
    var Transaction = /** @class */ (function () {
        function Transaction() {
            this.blockHeight = 0;
            this.txPubKey = '';
            this.outs = [];
            this.ins = [];
            this.timestamp = 0;
            this.paymentId = '';
            this.fees = 0;
        }
        Transaction.fromRaw = function (raw) {
            var transac = new Transaction();
            transac.blockHeight = raw.blockHeight;
            transac.txPubKey = raw.txPubKey;
            transac.timestamp = raw.timestamp;
            if (typeof raw.ins !== 'undefined') {
                var ins = [];
                for (var _i = 0, _a = raw.ins; _i < _a.length; _i++) {
                    var rin = _a[_i];
                    ins.push(TransactionIn.fromRaw(rin));
                }
                transac.ins = ins;
            }
            if (typeof raw.outs !== 'undefined') {
                var outs = [];
                for (var _b = 0, _c = raw.outs; _b < _c.length; _b++) {
                    var rout = _c[_b];
                    outs.push(TransactionOut.fromRaw(rout));
                }
                transac.outs = outs;
            }
            if (typeof raw.paymentId !== 'undefined')
                transac.paymentId = raw.paymentId;
            if (typeof raw.fees !== 'undefined')
                transac.fees = raw.fees;
            return transac;
        };
        Transaction.prototype.export = function () {
            var data = {
                blockHeight: this.blockHeight,
                txPubKey: this.txPubKey,
                timestamp: this.timestamp,
            };
            if (this.ins.length > 0) {
                var rins = [];
                for (var _i = 0, _a = this.ins; _i < _a.length; _i++) {
                    var nin = _a[_i];
                    rins.push(nin.export());
                }
                data.ins = rins;
            }
            if (this.outs.length > 0) {
                var routs = [];
                for (var _b = 0, _c = this.outs; _b < _c.length; _b++) {
                    var nout = _c[_b];
                    routs.push(nout.export());
                }
                data.outs = routs;
            }
            if (this.paymentId !== '')
                data.paymentId = this.paymentId;
            if (this.fees !== 0)
                data.fees = this.fees;
            return data;
        };
        Transaction.prototype.getAmount = function () {
            var amount = 0;
            for (var _i = 0, _a = this.outs; _i < _a.length; _i++) {
                var out = _a[_i];
                amount += out.amount;
            }
            for (var _b = 0, _c = this.ins; _b < _c.length; _b++) {
                var nin = _c[_b];
                amount -= nin.amount;
            }
            if (this.ins.length > 0) {
                amount -= this.fees;
            }
            return amount;
        };
        Transaction.prototype.isCoinbase = function () {
            return this.outs.length == 1 && this.outs[0].rtcAmount === '';
        };
        Transaction.prototype.isConfirmed = function (blockchainHeight) {
            if (this.isCoinbase() && this.blockHeight + config.txCoinbaseMinConfirms < blockchainHeight) {
                return true;
            }
            else if (!this.isCoinbase() && this.blockHeight + config.txMinConfirms < blockchainHeight) {
                return true;
            }
            return false;
        };
        return Transaction;
    }());
    exports.Transaction = Transaction;
});
//# sourceMappingURL=Transaction.js.map