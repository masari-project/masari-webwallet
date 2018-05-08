importScripts('../lib/require.js');
importScripts('../lib/biginteger.js');
importScripts('../config.js');
importScripts('../lib/base58.js');
importScripts('../lib/cn_utils.js');
importScripts('../lib/crypto.js');
// importScripts('../lib/mnemonic.js');
importScripts('../lib/nacl-fast.js');
importScripts('../lib/nacl-util.min.js');
importScripts('../lib/sha3.js');

require(['./TransferProcessing.js'], function (App) {});