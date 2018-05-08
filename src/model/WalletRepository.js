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
define(["require", "exports", "./Wallet"], function (require, exports, Wallet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WalletRepository = /** @class */ (function () {
        function WalletRepository() {
        }
        WalletRepository.hasOneStored = function () {
            return window.localStorage.getItem('wallet') !== null;
        };
        WalletRepository.getWithPassword = function (rawWallet, password) {
            if (password.length > 32)
                password = password.substr(0, 32);
            if (password.length < 32) {
                password = ('00000000000000000000000000000000' + password).slice(-32);
            }
            var privKey = new TextEncoder("utf8").encode(password);
            var nonce = new TextEncoder("utf8").encode(rawWallet.nonce);
            // rawWallet.encryptedKeys = this.b64DecodeUnicode(rawWallet.encryptedKeys);
            var encrypted = new Uint8Array(rawWallet.encryptedKeys);
            var decrypted = nacl.secretbox.open(encrypted, nonce, privKey);
            if (decrypted === null)
                return null;
            rawWallet.encryptedKeys = new TextDecoder("utf8").decode(decrypted);
            return Wallet_1.Wallet.loadFromRaw(rawWallet);
        };
        WalletRepository.getLocalWalletWithPassword = function (password) {
            var existingWallet = window.localStorage.getItem('wallet');
            if (existingWallet !== null) {
                return this.getWithPassword(JSON.parse(existingWallet), password);
            }
            else {
                return null;
            }
        };
        WalletRepository.save = function (wallet, password) {
            var rawWallet = this.getEncrypted(wallet, password);
            window.localStorage.setItem('wallet', JSON.stringify(rawWallet));
        };
        WalletRepository.getEncrypted = function (wallet, password) {
            if (password.length > 32)
                password = password.substr(0, 32);
            if (password.length < 32) {
                password = ('00000000000000000000000000000000' + password).slice(-32);
            }
            var privKey = new TextEncoder("utf8").encode(password);
            var rawNonce = nacl.util.encodeBase64(nacl.randomBytes(16));
            var nonce = new TextEncoder("utf8").encode(rawNonce);
            var rawWallet = wallet.exportToRaw();
            var uint8EncryptedKeys = new TextEncoder("utf8").encode(rawWallet.encryptedKeys);
            var encrypted = nacl.secretbox(uint8EncryptedKeys, nonce, privKey);
            rawWallet.encryptedKeys = encrypted.buffer;
            var tabEncrypted = [];
            for (var i = 0; i < encrypted.length; ++i) {
                tabEncrypted.push(encrypted[i]);
            }
            rawWallet.encryptedKeys = tabEncrypted;
            rawWallet.nonce = rawNonce;
            return rawWallet;
        };
        WalletRepository.deleteLocalCopy = function () {
            window.localStorage.removeItem('wallet');
        };
        return WalletRepository;
    }());
    exports.WalletRepository = WalletRepository;
});
//# sourceMappingURL=WalletRepository.js.map