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
define(["require", "exports", "../lib/numbersLab/VueAnnotate", "../lib/numbersLab/DependencyInjector", "../model/Wallet", "../lib/numbersLab/DestructableView", "../model/Constants", "../model/WalletRepository", "../model/Mnemonic"], function (require, exports, VueAnnotate_1, DependencyInjector_1, Wallet_1, DestructableView_1, Constants_1, WalletRepository_1, Mnemonic_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var wallet = DependencyInjector_1.DependencyInjectorInstance().getInstance(Wallet_1.Wallet.name, 'default', false);
    var blockchainExplorer = DependencyInjector_1.DependencyInjectorInstance().getInstance(Constants_1.Constants.BLOCKCHAIN_EXPLORER);
    var ExportView = /** @class */ (function (_super) {
        __extends(ExportView, _super);
        function ExportView(container) {
            var _this = _super.call(this, container) || this;
            var self = _this;
            _this.publicAddress = wallet.getPublicAddress();
            return _this;
        }
        ExportView.prototype.destruct = function () {
            return _super.prototype.destruct.call(this);
        };
        ExportView.prototype.getPrivateKeys = function () {
            swal({
                title: 'Wallet password',
                input: 'password',
                showCancelButton: true,
                confirmButtonText: 'open',
            }).then(function (result) {
                if (result.value) {
                    var savePassword = result.value;
                    // let password = prompt();
                    // let wallet = WalletRepository.getMain();
                    var wallet_1 = WalletRepository_1.WalletRepository.getLocalWalletWithPassword(savePassword);
                    if (wallet_1 !== null) {
                        swal({
                            title: 'Private keys',
                            html: 'Please store carefully those keys. <b>Possessing them means possessing the funds associated</b> !<br/>' +
                                'Spend key: ' + wallet_1.keys.priv.spend + '<br/>' +
                                'Private key: ' + wallet_1.keys.priv.view,
                        });
                    }
                    else {
                        swal({
                            type: 'error',
                            title: 'Oops...',
                            text: 'Your password seems invalid',
                        });
                    }
                }
            });
        };
        ExportView.prototype.getMnemonicPhrase = function () {
            swal({
                title: 'Wallet password',
                input: 'password',
                showCancelButton: true,
                confirmButtonText: 'open',
            }).then(function (result) {
                if (result.value) {
                    var savePassword = result.value;
                    // let password = prompt();
                    // let wallet = WalletRepository.getMain();
                    var wallet_2 = WalletRepository_1.WalletRepository.getLocalWalletWithPassword(savePassword);
                    if (wallet_2 !== null) {
                        var privateSpend = 'aff6f35943dc9a364f6ca6b6a91074be5ec55d33cc30bf994d2b7b2f41679e07';
                        var mnemonic = Mnemonic_1.Mnemonic.mn_encode(privateSpend, 'english');
                        swal({
                            title: 'Private keys',
                            html: 'Please store carefully this mnemonic phrase. <b>Possessing it means possessing the funds associated</b> ! The phrase in the english dictionary is:<br/>' +
                                mnemonic
                        });
                    }
                    else {
                        swal({
                            type: 'error',
                            title: 'Oops...',
                            text: 'Your password seems invalid',
                        });
                    }
                }
            });
        };
        ExportView.prototype.fileExport = function () {
            swal({
                title: 'Wallet password',
                input: 'password',
                showCancelButton: true,
                confirmButtonText: 'open',
            }).then(function (result) {
                if (result.value) {
                    var savePassword = result.value;
                    // let password = prompt();
                    // let wallet = WalletRepository.getMain();
                    var wallet_3 = WalletRepository_1.WalletRepository.getLocalWalletWithPassword(savePassword);
                    if (wallet_3 !== null) {
                        var exported = WalletRepository_1.WalletRepository.getEncrypted(wallet_3, savePassword);
                        var blob = new Blob([JSON.stringify(exported)], { type: "application/json" });
                        saveAs(blob, "wallet.json");
                    }
                    else {
                        swal({
                            type: 'error',
                            title: 'Oops...',
                            text: 'Your password seems invalid',
                        });
                    }
                }
            });
        };
        __decorate([
            VueAnnotate_1.VueVar('')
        ], ExportView.prototype, "publicAddress", void 0);
        return ExportView;
    }(DestructableView_1.DestructableView));
    if (wallet !== null && blockchainExplorer !== null)
        new ExportView('#app');
    else
        window.location.href = '#index';
});
//# sourceMappingURL=export.js.map