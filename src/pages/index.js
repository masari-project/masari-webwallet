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
define(["require", "exports", "../model/WalletRepository", "../lib/numbersLab/DependencyInjector", "../model/Constants", "../model/blockchain/BlockchainExplorerRpc2", "../lib/numbersLab/VueAnnotate", "../lib/numbersLab/DestructableView", "../model/Wallet", "../model/KeysRepository", "../lib/numbersLab/Observable", "../model/Mnemonic"], function (require, exports, WalletRepository_1, DependencyInjector_1, Constants_1, BlockchainExplorerRpc2_1, VueAnnotate_1, DestructableView_1, Wallet_1, KeysRepository_1, Observable_1, Mnemonic_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var injector = DependencyInjector_1.DependencyInjectorInstance();
    var blockchainExplorer = injector.getInstance(Constants_1.Constants.BLOCKCHAIN_EXPLORER);
    if (blockchainExplorer === null) {
        blockchainExplorer = new BlockchainExplorerRpc2_1.BlockchainExplorerRpc2();
        injector.register(Constants_1.Constants.BLOCKCHAIN_EXPLORER, blockchainExplorer);
    }
    var WalletWorker = /** @class */ (function () {
        function WalletWorker(wallet, password) {
            this.intervalSave = 0;
            this.wallet = wallet;
            this.password = password;
            var self = this;
            wallet.addObserver(Observable_1.Observable.EVENT_MODIFIED, function () {
                if (self.intervalSave === 0)
                    self.intervalSave = setTimeout(function () {
                        self.save();
                        self.intervalSave = 0;
                    }, 1000);
            });
            this.save();
        }
        WalletWorker.prototype.save = function () {
            WalletRepository_1.WalletRepository.save(this.wallet, this.password);
        };
        return WalletWorker;
    }());
    var IndexView = /** @class */ (function (_super) {
        __extends(IndexView, _super);
        function IndexView(container) {
            var _this = _super.call(this, container) || this;
            _this.isWalletLoaded = DependencyInjector_1.DependencyInjectorInstance().getInstance(Wallet_1.Wallet.name, 'default', false) !== null;
            _this.hasLocalWallet = WalletRepository_1.WalletRepository.hasOneStored();
            return _this;
            // this.importWallet();
        }
        IndexView.prototype.destruct = function () {
            return _super.prototype.destruct.call(this);
        };
        IndexView.prototype.loadWallet = function () {
            var _this = this;
            swal({
                title: 'Wallet password',
                input: 'password',
                showCancelButton: true,
                confirmButtonText: 'open',
            }).then(function (result) {
                if (result.value) {
                    var savePassword = result.value;
                    // let password = prompt();
                    var memoryWallet = DependencyInjector_1.DependencyInjectorInstance().getInstance(Wallet_1.Wallet.name, 'default', false);
                    if (memoryWallet === null) {
                        // let wallet = WalletRepository.getMain();
                        var wallet = WalletRepository_1.WalletRepository.getLocalWalletWithPassword(savePassword);
                        if (wallet !== null) {
                            console.log(wallet);
                            _this.setupWallet(wallet, savePassword);
                            window.location.href = '#account';
                        }
                        else {
                            swal({
                                type: 'error',
                                title: 'Oops...',
                                text: 'Your password seems invalid',
                            });
                        }
                    }
                }
            });
        };
        IndexView.prototype.loadWalletFromFile = function () {
            var self = this;
            var element = $('<input type="file">');
            element.on('change', function (event) {
                var files = event.target.files; // FileList object
                if (files.length > 0) {
                    var fileReader_1 = new FileReader();
                    fileReader_1.onload = function () {
                        swal({
                            title: 'Wallet password',
                            input: 'password',
                            showCancelButton: true,
                            confirmButtonText: 'open',
                        }).then(function (passwordResult) {
                            if (passwordResult.value) {
                                var savePassword = passwordResult.value;
                                var newWallet = WalletRepository_1.WalletRepository.getWithPassword(JSON.parse(fileReader_1.result), savePassword);
                                if (newWallet !== null) {
                                    self.setupWallet(newWallet, savePassword);
                                    window.location.href = '#account';
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
                    fileReader_1.readAsText(files[0]);
                }
                else {
                    swal({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Please select a file to import',
                    });
                }
            });
            element.click();
        };
        IndexView.prototype.setupWallet = function (wallet, password) {
            var walletWorker = new WalletWorker(wallet, password);
            DependencyInjector_1.DependencyInjectorInstance().register(Wallet_1.Wallet.name, wallet);
            var watchdog = blockchainExplorer.watchdog(wallet);
            DependencyInjector_1.DependencyInjectorInstance().register(BlockchainExplorerRpc2_1.WalletWatchdog.name, watchdog);
            $('body').addClass('connected');
        };
        IndexView.prototype.importWallet = function () {
            var self = this;
            swal({
                title: 'Import a wallet',
                html: "\n<div class=\"importKeys\" >\n\t<div>\n\t\t<label>Password for the wallet</label>\n\t\t<input id=\"importWalletPassword\" placeholder=\"Password for the wallet\" autocomplete=\"off\">\n\t</div>\n\t<div>\n\t\t<label>Spend key</label>\n\t\t<input id=\"importWalletSpendKey\" placeholder=\"Spend key\" autocomplete=\"off\">\n\t</div>\n\t<div>\n\t\t<label>View key</label>\n\t\t<input id=\"importWalletViewKey\" placeholder=\"View key\" autocomplete=\"off\">\n\t</div>\n\t<div>\n\t\t<label>Height from which to start scanning</label>\n\t\t<input type=\"number\" id=\"importWalletHeight\" placeholder=\"Height from which to start scanning\" value=\"0\">\n\t</div>\n</div>\n",
                focusConfirm: false,
                preConfirm: function () {
                    var passwordInput = document.getElementById('importWalletPassword');
                    var passwordSpend = document.getElementById('importWalletSpendKey');
                    var passwordView = document.getElementById('importWalletViewKey');
                    var passwordHeight = document.getElementById('importWalletHeight');
                    return {
                        password: passwordInput !== null ? passwordInput.value : null,
                        spend: passwordSpend !== null ? passwordSpend.value : null,
                        view: passwordView !== null ? passwordView.value : null,
                        height: passwordHeight !== null ? parseInt(passwordHeight.value) : null,
                    };
                }
            }).then(function (result) {
                blockchainExplorer.getHeight().then(function (currentHeight) {
                    console.log(result.value);
                    if (result.value &&
                        result.value.spend && result.value.view && result.value.password && result.value.height &&
                        result.value.spend.length > 0 &&
                        result.value.view.length > 0 &&
                        result.value.height >= 0 &&
                        result.value.password.length > 0) {
                        if (!self.checkPasswordConstraints(result.value.password))
                            return;
                        var newWallet = new Wallet_1.Wallet();
                        newWallet.keys = KeysRepository_1.KeysRepository.fromPriv(result.value.spend, result.value.view);
                        if (result.value.height >= currentHeight) {
                            result.value.height = currentHeight - 1;
                        }
                        var height = currentHeight - 10;
                        if (height < 0)
                            height = 0;
                        newWallet.lastHeight = height;
                        self.setupWallet(newWallet, result.value.password);
                        window.location.href = '#account';
                        // }
                    }
                });
            });
        };
        IndexView.prototype.createNewWallet = function () {
            var self = this;
            swal({
                title: 'New wallet',
                html: "\n<div class=\"importKeys\" >\n\t<div>\n\t\t<label>Password for the wallet</label>\n\t\t<input type=\"password\" id=\"importWalletPassword\" placeholder=\"Password for the wallet\" autocomplete=\"off\">\n\t</div>\n</div>\n",
                focusConfirm: false,
                preConfirm: function () {
                    var passwordInput = document.getElementById('importWalletPassword');
                    return {
                        password: passwordInput !== null ? passwordInput.value : null,
                    };
                }
            }).then(function (result) {
                blockchainExplorer.getHeight().then(function (currentHeight) {
                    console.log(result.value);
                    if (result.value &&
                        result.value.password &&
                        result.value.password.length > 0) {
                        if (!self.checkPasswordConstraints(result.value.password))
                            return;
                        var seed = cnUtil.sc_reduce32(cnUtil.rand_32());
                        console.log(seed, cnUtil.rand_32());
                        var keys = cnUtil.create_address(seed);
                        var newWallet = new Wallet_1.Wallet();
                        newWallet.keys = KeysRepository_1.KeysRepository.fromPriv(keys.spend.sec, keys.view.sec);
                        var height = currentHeight - 10;
                        if (height < 0)
                            height = 0;
                        newWallet.lastHeight = height;
                        self.setupWallet(newWallet, result.value.password);
                        swal({
                            type: 'info',
                            title: 'Information',
                            text: 'Please make a backup of your private keys by going in the export tab',
                        });
                        window.location.href = '#account';
                    }
                });
            });
        };
        IndexView.prototype.importFromMnemonic = function () {
            var self = this;
            swal({
                title: 'New wallet',
                html: "\n<div class=\"importKeys\" >\n\t<div>\n\t\t<label>Password for the wallet</label>\n\t\t<input type=\"password\" id=\"importWalletPassword\" placeholder=\"Password for the wallet\" autocomplete=\"off\">\n\t</div>\n\t<div>\n\t\t<label>Mnemonic phrase</label>\n\t\t<input id=\"importWalletMnemonic\" placeholder=\"Your 25 words\">\n\t</div>\n\t<div>\n\t\t<label>The menmonic lang</label>\n\t\t<select id=\"importWalletMnemonicLang\" >\n\t\t\t<option value=\"english\" >English</option>\n\t\t\t<option value=\"chinese\" >Chinese (simplified)</option>\n\t\t\t<option value=\"french\" >French</option>\n\t\t\t<option value=\"dutch\" >Dutch</option>\n\t\t\t<option value=\"italian\" >Italian</option>\n\t\t\t<option value=\"spanish\" >Spanish</option>\n\t\t\t<option value=\"portuguese\" >Portuguese</option>\n\t\t\t<option value=\"japanese\" >Japanese</option>\n\t\t\t<option value=\"electrum\" >Electrum</option>\n\t\t</select>\n\t</div>\n\t<div>\n\t\t<label>Height from which to start scanning</label>\n\t\t<input type=\"number\" id=\"importWalletHeight\" placeholder=\"Height from which to start scanning\" value=\"0\">\n\t</div>\n</div>\n",
                focusConfirm: false,
                preConfirm: function () {
                    var passwordInput = document.getElementById('importWalletPassword');
                    var mnemonicInput = document.getElementById('importWalletMnemonic');
                    var mnemonicLangInput = document.getElementById('importWalletMnemonicLang');
                    var heightInput = document.getElementById('importWalletHeight');
                    return {
                        password: passwordInput !== null ? passwordInput.value : null,
                        mnemonic: mnemonicInput !== null ? mnemonicInput.value : null,
                        mnemonicLang: mnemonicLangInput !== null ? mnemonicLangInput.value : null,
                        height: heightInput !== null ? heightInput.value : null,
                    };
                }
            }).then(function (result) {
                if (result.value &&
                    result.value.password &&
                    result.value.mnemonic &&
                    result.value.mnemonicLang &&
                    result.value.height &&
                    result.value.password.length > 0 &&
                    result.value.mnemonic.length > 0) {
                    if (!self.checkPasswordConstraints(result.value.password))
                        return;
                    // let mnemonic = 'always afraid tobacco poetry woes today pause glass hesitate nail doing fitting obtains vexed bypass costume cupcake betting muzzle shrugged fruit getting adapt alarms doing';
                    var mnemonic = result.value.mnemonic;
                    // let current_lang = 'english';
                    var current_lang = result.value.mnemonicLang;
                    var mnemonic_decoded = Mnemonic_1.Mnemonic.mn_decode(mnemonic, current_lang);
                    if (mnemonic_decoded !== null) {
                        var keys = cnUtil.create_address(mnemonic_decoded);
                        var newWallet = new Wallet_1.Wallet();
                        newWallet.keys = KeysRepository_1.KeysRepository.fromPriv(keys.spend.sec, keys.view.sec);
                        var height = result.value.height - 10;
                        if (height < 0)
                            height = 0;
                        newWallet.lastHeight = height;
                        self.setupWallet(newWallet, result.value.password);
                        window.location.href = '#account';
                    }
                    else {
                        swal({
                            type: 'error',
                            title: 'Oops...',
                            text: 'The mnemonic phrase is invalid',
                        });
                    }
                }
            });
        };
        IndexView.prototype.checkPasswordConstraints = function (password, raiseError) {
            if (raiseError === void 0) { raiseError = true; }
            var anUpperCase = /[A-Z]/;
            var aLowerCase = /[a-z]/;
            var aNumber = /[0-9]/;
            var aSpecial = /[!|@|#|$|%|^|&|*|(|)|-|_]/;
            var numUpper = 0;
            var numLower = 0;
            var numNums = 0;
            var numSpecials = 0;
            for (var i = 0; i < password.length; i++) {
                if (anUpperCase.test(password[i]))
                    numUpper++;
                else if (aLowerCase.test(password[i]))
                    numLower++;
                else if (aNumber.test(password[i]))
                    numNums++;
                else if (aSpecial.test(password[i]))
                    numSpecials++;
            }
            if (password.length < 8 || numUpper < 1 || numLower < 1 || numNums < 1 || numSpecials < 1) {
                if (raiseError) {
                    swal({
                        type: 'error',
                        title: 'The password is not complex enough',
                        text: 'The password need at least 8 characters, 1 upper case letter, 1 lower case letter, one number and one special character',
                    });
                }
                return false;
            }
            return true;
        };
        __decorate([
            VueAnnotate_1.VueVar(false)
        ], IndexView.prototype, "hasLocalWallet", void 0);
        __decorate([
            VueAnnotate_1.VueVar(false)
        ], IndexView.prototype, "isWalletLoaded", void 0);
        __decorate([
            VueAnnotate_1.VueVar(false)
        ], IndexView.prototype, "importSelectorActive", void 0);
        return IndexView;
    }(DestructableView_1.DestructableView));
    var newIndexView = new IndexView('#app');
});
//# sourceMappingURL=index.js.map