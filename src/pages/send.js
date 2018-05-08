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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "../lib/numbersLab/DestructableView", "../lib/numbersLab/VueAnnotate", "../model/TransactionsExplorer", "../model/blockchain/BlockchainExplorerRpc2", "../lib/numbersLab/DependencyInjector", "../model/Constants", "../model/Wallet", "sweetalert2"], function (require, exports, DestructableView_1, VueAnnotate_1, TransactionsExplorer_1, BlockchainExplorerRpc2_1, DependencyInjector_1, Constants_1, Wallet_1, sweetalert2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var wallet = DependencyInjector_1.DependencyInjectorInstance().getInstance(Wallet_1.Wallet.name, 'default', false);
    var blockchainExplorer = DependencyInjector_1.DependencyInjectorInstance().getInstance(Constants_1.Constants.BLOCKCHAIN_EXPLORER);
    var SendView = /** @class */ (function (_super) {
        __extends(SendView, _super);
        function SendView(container) {
            return _super.call(this, container) || this;
        }
        SendView.prototype.send = function () {
            var self = this;
            blockchainExplorer.getHeight().then(function (height) {
                var amount = parseFloat(self.amountToSend);
                if (amount > 0 && self.destinationAddress !== null) {
                    //todo use BigInteger
                    if (amount * Math.pow(10, config.coinUnitPlaces) > wallet.unlockedAmount(height)) {
                        sweetalert2_1.default({
                            type: 'error',
                            title: 'Oops...',
                            text: 'You don\'t have enough funds in your wallet to execute this transfer',
                        });
                        return;
                    }
                    //TODO use biginteger
                    var amountToSend_1 = amount * Math.pow(10, config.coinUnitPlaces);
                    var destinationAddress_1 = self.destinationAddress;
                    sweetalert2_1.default({
                        title: 'Creating transfer ...',
                        text: 'Please wait...',
                        onOpen: function () {
                            sweetalert2_1.default.showLoading();
                        }
                        // showCancelButton: true,
                        // confirmButtonText: 'Confirm',
                    });
                    blockchainExplorer.getRandomOuts(12).then(function (mix_outs) {
                        // let mix_outs : any[] = [];
                        console.log('------------------------------mix_outs', mix_outs);
                        TransactionsExplorer_1.TransactionsExplorer.createTx(destinationAddress_1, amountToSend_1, wallet, mix_outs, function (amount, feesAmount) {
                            return sweetalert2_1.default({
                                title: 'Confirm transfer ?',
                                html: 'Amount: ' + Vue.options.filters.piconero(amount) + '<br/>Fees: ' + Vue.options.filters.piconero(feesAmount),
                                showCancelButton: true,
                                confirmButtonText: 'Confirm',
                            }).then(function (result) {
                                if (result.dismiss) {
                                    return Promise.reject('');
                                }
                            });
                        }).then(function (rawTx) {
                            blockchainExplorer.sendRawTx(rawTx).then(function () {
                                //force a mempool check so the user is up to date
                                var watchdog = DependencyInjector_1.DependencyInjectorInstance().getInstance(BlockchainExplorerRpc2_1.WalletWatchdog.name);
                                if (watchdog !== null)
                                    watchdog.checkMempool();
                                sweetalert2_1.default({
                                    type: 'success',
                                    title: 'Transfer sent !',
                                });
                            }).catch(function (data) {
                                sweetalert2_1.default({
                                    type: 'error',
                                    title: 'Oops...',
                                    text: 'An error occurred. Please report us this error: ' + JSON.stringify(data),
                                });
                            });
                        }).catch(function (error) {
                            if (error && error !== '') {
                                alert(error);
                            }
                        });
                    });
                }
                else {
                    sweetalert2_1.default({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Invalid amount',
                    });
                }
            });
        };
        SendView.prototype.destinationAddressWatch = function () {
            try {
                cnUtil.decode_address(this.destinationAddress);
                this.destinationAddressValid = true;
            }
            catch (e) {
                this.destinationAddressValid = false;
            }
        };
        SendView.prototype.amountToSendWatch = function () {
            try {
                this.amountToSendValid = !isNaN(parseFloat(this.amountToSend));
            }
            catch (e) {
                this.amountToSendValid = false;
            }
        };
        __decorate([
            VueAnnotate_1.VueVar('')
        ], SendView.prototype, "destinationAddress", void 0);
        __decorate([
            VueAnnotate_1.VueVar(false)
        ], SendView.prototype, "destinationAddressValid", void 0);
        __decorate([
            VueAnnotate_1.VueVar('10.5')
        ], SendView.prototype, "amountToSend", void 0);
        __decorate([
            VueAnnotate_1.VueVar(true)
        ], SendView.prototype, "amountToSendValid", void 0);
        __decorate([
            VueAnnotate_1.VueWatched()
        ], SendView.prototype, "destinationAddressWatch", null);
        __decorate([
            VueAnnotate_1.VueWatched()
        ], SendView.prototype, "amountToSendWatch", null);
        return SendView;
    }(DestructableView_1.DestructableView));
    if (wallet !== null && blockchainExplorer !== null)
        new SendView('#app');
    else
        window.location.href = '#index';
});
//# sourceMappingURL=send.js.map