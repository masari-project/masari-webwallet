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

import {Mnemonic} from "./Mnemonic";
// import {CnUtilNative} from "../CnUtilNative";

declare let Module : any;

let HASH_STATE_BYTES = 200;
let HASH_SIZE = 32;
let ADDRESS_CHECKSUM_SIZE = 4;
let INTEGRATED_ID_SIZE = 8;
let ENCRYPTED_PAYMENT_ID_TAIL = 141;
let CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = config.addressPrefix;
let CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX = config.integratedAddressPrefix;
let CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX = config.subAddressPrefix;
if (config.testnet === true)
{
	CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = config.addressPrefixTestnet;
	CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX = config.integratedAddressPrefixTestnet;
	CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX = config.subAddressPrefixTestnet;
}
let UINT64_MAX = new JSBigInt(2).pow(64);
let CURRENT_TX_VERSION = 1;
let OLD_TX_VERSION = 1;
let TX_EXTRA_NONCE_MAX_COUNT = 255;
let TX_EXTRA_TAGS = {
	PADDING: '00',
	PUBKEY: '01',
	NONCE: '02',
	MERGE_MINING: '03'
};
let TX_EXTRA_NONCE_TAGS = {
	PAYMENT_ID: '00',
	ENCRYPTED_PAYMENT_ID: '01'
};
let KEY_SIZE = 32;
let STRUCT_SIZES = {
	GE_P3: 160,
	GE_P2: 120,
	GE_P1P1: 160,
	GE_CACHED: 160,
	EC_SCALAR: 32,
	EC_POINT: 32,
	KEY_IMAGE: 32,
	GE_DSMP: 160 * 8, // ge_cached * 8
	SIGNATURE: 64 // ec_scalar * 2
};

export namespace CnVars{
	export enum RCT_TYPE{
		Null = 0,
		Full = 1,
		Simple = 2,
		FullBulletproof = 3,
		SimpleBulletproof = 4,
	}

	export let H = "8b655970153799af2aeadc9ff1add0ea6c7251d54154cfa92c173a0dd39c1f94"; //base H for amounts
	export let l = JSBigInt("7237005577332262213973186563042994240857116359379907606001950938285454250989"); //curve order (not RCT specific)
	export let I = "0100000000000000000000000000000000000000000000000000000000000000"; //identity element
	export let Z = "0000000000000000000000000000000000000000000000000000000000000000"; //zero scalar
	//H2 object to speed up some operations
	export let H2 = ["8b655970153799af2aeadc9ff1add0ea6c7251d54154cfa92c173a0dd39c1f94", "8faa448ae4b3e2bb3d4d130909f55fcd79711c1c83cdbccadd42cbe1515e8712",
		"12a7d62c7791654a57f3e67694ed50b49a7d9e3fc1e4c7a0bde29d187e9cc71d", "789ab9934b49c4f9e6785c6d57a498b3ead443f04f13df110c5427b4f214c739",
		"771e9299d94f02ac72e38e44de568ac1dcb2edc6edb61f83ca418e1077ce3de8", "73b96db43039819bdaf5680e5c32d741488884d18d93866d4074a849182a8a64",
		"8d458e1c2f68ebebccd2fd5d379f5e58f8134df3e0e88cad3d46701063a8d412", "09551edbe494418e81284455d64b35ee8ac093068a5f161fa6637559177ef404",
		"d05a8866f4df8cee1e268b1d23a4c58c92e760309786cdac0feda1d247a9c9a7", "55cdaad518bd871dd1eb7bc7023e1dc0fdf3339864f88fdd2de269fe9ee1832d",
		"e7697e951a98cfd5712b84bbe5f34ed733e9473fcb68eda66e3788df1958c306", "f92a970bae72782989bfc83adfaa92a4f49c7e95918b3bba3cdc7fe88acc8d47",
		"1f66c2d491d75af915c8db6a6d1cb0cd4f7ddcd5e63d3ba9b83c866c39ef3a2b", "3eec9884b43f58e93ef8deea260004efea2a46344fc5965b1a7dd5d18997efa7",
		"b29f8f0ccb96977fe777d489d6be9e7ebc19c409b5103568f277611d7ea84894", "56b1f51265b9559876d58d249d0c146d69a103636699874d3f90473550fe3f2c",
		"1d7a36575e22f5d139ff9cc510fa138505576b63815a94e4b012bfd457caaada", "d0ac507a864ecd0593fa67be7d23134392d00e4007e2534878d9b242e10d7620",
		"f6c6840b9cf145bb2dccf86e940be0fc098e32e31099d56f7fe087bd5deb5094", "28831a3340070eb1db87c12e05980d5f33e9ef90f83a4817c9f4a0a33227e197",
		"87632273d629ccb7e1ed1a768fa2ebd51760f32e1c0b867a5d368d5271055c6e", "5c7b29424347964d04275517c5ae14b6b5ea2798b573fc94e6e44a5321600cfb",
		"e6945042d78bc2c3bd6ec58c511a9fe859c0ad63fde494f5039e0e8232612bd5", "36d56907e2ec745db6e54f0b2e1b2300abcb422e712da588a40d3f1ebbbe02f6",
		"34db6ee4d0608e5f783650495a3b2f5273c5134e5284e4fdf96627bb16e31e6b", "8e7659fb45a3787d674ae86731faa2538ec0fdf442ab26e9c791fada089467e9",
		"3006cf198b24f31bb4c7e6346000abc701e827cfbb5df52dcfa42e9ca9ff0802", "f5fd403cb6e8be21472e377ffd805a8c6083ea4803b8485389cc3ebc215f002a",
		"3731b260eb3f9482e45f1c3f3b9dcf834b75e6eef8c40f461ea27e8b6ed9473d", "9f9dab09c3f5e42855c2de971b659328a2dbc454845f396ffc053f0bb192f8c3",
		"5e055d25f85fdb98f273e4afe08464c003b70f1ef0677bb5e25706400be620a5", "868bcf3679cb6b500b94418c0b8925f9865530303ae4e4b262591865666a4590",
		"b3db6bd3897afbd1df3f9644ab21c8050e1f0038a52f7ca95ac0c3de7558cb7a", "8119b3a059ff2cac483e69bcd41d6d27149447914288bbeaee3413e6dcc6d1eb",
		"10fc58f35fc7fe7ae875524bb5850003005b7f978c0c65e2a965464b6d00819c", "5acd94eb3c578379c1ea58a343ec4fcff962776fe35521e475a0e06d887b2db9",
		"33daf3a214d6e0d42d2300a7b44b39290db8989b427974cd865db011055a2901", "cfc6572f29afd164a494e64e6f1aeb820c3e7da355144e5124a391d06e9f95ea",
		"d5312a4b0ef615a331f6352c2ed21dac9e7c36398b939aec901c257f6cbc9e8e", "551d67fefc7b5b9f9fdbf6af57c96c8a74d7e45a002078a7b5ba45c6fde93e33",
		"d50ac7bd5ca593c656928f38428017fc7ba502854c43d8414950e96ecb405dc3", "0773e18ea1be44fe1a97e239573cfae3e4e95ef9aa9faabeac1274d3ad261604",
		"e9af0e7ca89330d2b8615d1b4137ca617e21297f2f0ded8e31b7d2ead8714660", "7b124583097f1029a0c74191fe7378c9105acc706695ed1493bb76034226a57b",
		"ec40057b995476650b3db98e9db75738a8cd2f94d863b906150c56aac19caa6b", "01d9ff729efd39d83784c0fe59c4ae81a67034cb53c943fb818b9d8ae7fc33e5",
		"00dfb3c696328c76424519a7befe8e0f6c76f947b52767916d24823f735baf2e", "461b799b4d9ceea8d580dcb76d11150d535e1639d16003c3fb7e9d1fd13083a8",
		"ee03039479e5228fdc551cbde7079d3412ea186a517ccc63e46e9fcce4fe3a6c", "a8cfb543524e7f02b9f045acd543c21c373b4c9b98ac20cec417a6ddb5744e94",
		"932b794bf89c6edaf5d0650c7c4bad9242b25626e37ead5aa75ec8c64e09dd4f", "16b10c779ce5cfef59c7710d2e68441ea6facb68e9b5f7d533ae0bb78e28bf57",
		"0f77c76743e7396f9910139f4937d837ae54e21038ac5c0b3fd6ef171a28a7e4", "d7e574b7b952f293e80dde905eb509373f3f6cd109a02208b3c1e924080a20ca",
		"45666f8c381e3da675563ff8ba23f83bfac30c34abdde6e5c0975ef9fd700cb9", "b24612e454607eb1aba447f816d1a4551ef95fa7247fb7c1f503020a7177f0dd",
		"7e208861856da42c8bb46a7567f8121362d9fb2496f131a4aa9017cf366cdfce", "5b646bff6ad1100165037a055601ea02358c0f41050f9dfe3c95dccbd3087be0",
		"746d1dccfed2f0ff1e13c51e2d50d5324375fbd5bf7ca82a8931828d801d43ab", "cb98110d4a6bb97d22feadbc6c0d8930c5f8fc508b2fc5b35328d26b88db19ae",
		"60b626a033b55f27d7676c4095eababc7a2c7ede2624b472e97f64f96b8cfc0e", "e5b52bc927468df71893eb8197ef820cf76cb0aaf6e8e4fe93ad62d803983104",
		"056541ae5da9961be2b0a5e895e5c5ba153cbb62dd561a427bad0ffd41923199", "f8fef05a3fa5c9f3eba41638b247b711a99f960fe73aa2f90136aeb20329b888"];
}

export namespace CnRandom{
	// Generate a 256-bit / 64-char / 32-byte crypto random
	export function rand_32() {
		return Mnemonic.mn_random(256);
	}

	// Generate a 128-bit / 32-char / 16-byte crypto random
	export function rand_16() {
		return Mnemonic.mn_random(128);
	}

	// Generate a 64-bit / 16-char / 8-byte crypto random
	export function rand_8() {
		return Mnemonic.mn_random(64);
	}

	export function random_scalar() {
		//let rand = this.sc_reduce(mn_random(64 * 8));
		//return rand.slice(0, STRUCT_SIZES.EC_SCALAR * 2);
		return CnNativeBride.sc_reduce32(CnRandom.rand_32());
	}
}

export namespace CnUtils{

	export function hextobin(hex : string) : Uint8Array{
		if (hex.length % 2 !== 0) throw "Hex string has invalid length!";
		let res = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length / 2; ++i) {
			res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
		return res;
	}

	export function bintohex(bin : Uint8Array|string) : string {
		let out = [];
		if(typeof bin === 'string'){
			for (let i = 0; i < bin.length; ++i) {
				out.push(("0" + bin[i].charCodeAt(0).toString(16)).slice(-2));
			}
		}else {
			for (let i = 0; i < bin.length; ++i) {
				out.push(("0" + bin[i].toString(16)).slice(-2));
			}
		}
		return out.join("");
	}

	//switch byte order for hex string
	export function swapEndian(hex : string){
		if (hex.length % 2 !== 0){return "length must be a multiple of 2!";}
		let data = "";
		for (let i=1; i <= hex.length / 2; i++){
			data += hex.substr(0 - 2 * i, 2);
		}
		return data;
	}

	//switch byte order charwise
	export function swapEndianC(string : string) : string{
		let data = "";
		for (let i=1; i <= string.length; i++){
			data += string.substr(0 - i, 1);
		}
		return data;
	}

//for most uses you'll also want to swapEndian after conversion
	//mainly to convert integer "scalars" to usable hexadecimal strings
	export function d2h(integer : number|string){
		if (typeof integer !== "string" && integer.toString().length > 15){throw "integer should be entered as a string for precision";}
		let padding = "";
		for (let i = 0; i < 63; i++){
			padding += "0";
		}
		return (padding + JSBigInt(integer).toString(16).toLowerCase()).slice(-64);
	}

	//integer (string) to scalar
	export function d2s(integer : number|string){
		return CnUtils.swapEndian(CnUtils.d2h(integer));
	}

	// hexadecimal to integer
	export function h2d(hex : any) {
		/*let vali = 0;
		for (let j = 7; j >= 0; j--) {
			vali = (vali * 256 + test[j].charCodeAt(0));
		}
		return vali;*/
		// return JSBigInt.parse(test,16);
		// let bytes = Crypto.hextobin(test);
		// console.log('bytes',bytes, test,swapEndianC(test));
		// console.log(JSBigInt.parse(swapEndianC(test),16).valueOf());
		// console.log(JSBigInt.parse(test.substr(0,12),16).valueOf());
		let vali = 0;
		for (let j = 7; j >= 0; j--) {
			// console.log(vali,vali*256,bytes[j]);
			vali = (vali * 256 + parseInt(hex.slice(j*2, j*2+2), 16));
		}
		return vali;
	}

	export function d2b(integer : string) : string{
		let integerStr = integer.toString();
		if (typeof integer !== "string" && integerStr.length > 15){throw "integer should be entered as a string for precision";}
		let padding = "";
		for (let i = 0; i < 63; i++){
			padding += "0";
		}
		let a = new JSBigInt(integerStr);
		if (a.toString(2).length > 64){throw "amount overflows uint64!";}
		return CnUtils.swapEndianC((padding + a.toString(2)).slice(-64));
	}

	export function ge_scalarmult(pub : string, sec : string) {
		if (pub.length !== 64 || sec.length !== 64) {
			throw "Invalid input length";
		}
		return CnUtils.bintohex(nacl.ll.ge_scalarmult(CnUtils.hextobin(pub), CnUtils.hextobin(sec)));
	}

	export function ge_add(p1 : string, p2 : string) {
		if (p1.length !== 64 || p2.length !== 64) {
			throw "Invalid input length!";
		}
		return bintohex(nacl.ll.ge_add(hextobin(p1), hextobin(p2)));
	}

	//curve and scalar functions; split out to make their host functions cleaner and more readable
	//inverts X coordinate -- this seems correct ^_^ -luigi1111
	export function ge_neg(point : string) {
		if (point.length !== 64){
			throw "expected 64 char hex string";
		}
		return point.slice(0,62) + ((parseInt(point.slice(62,63), 16) + 8) % 16).toString(16) + point.slice(63,64);
	}

	//order matters
	export function ge_sub(point1 : string, point2 : string) {
		let point2n = CnUtils.ge_neg(point2);
		return CnUtils.ge_add(point1, point2n);
	}

	export function sec_key_to_pub(sec : string) : string {
		if (sec.length !== 64) {
			throw "Invalid sec length";
		}
		return CnUtils.bintohex(nacl.ll.ge_scalarmult_base(hextobin(sec)));
	}

	export function valid_hex(hex : string) {
		let exp = new RegExp("[0-9a-fA-F]{" + hex.length + "}");
		return exp.test(hex);
	}
	
	export function ge_scalarmult_base(sec : string) : string{
		return CnUtils.sec_key_to_pub(sec);
	}

	export function derivation_to_scalar(derivation : string, output_index : number) {
		let buf = "";
		if (derivation.length !== (STRUCT_SIZES.EC_POINT * 2)) {
			throw "Invalid derivation length!";
		}
		buf += derivation;
		let enc = CnUtils.encode_varint(output_index);
		if (enc.length > 10 * 2) {
			throw "output_index didn't fit in 64-bit varint";
		}
		buf += enc;
		return Cn.hash_to_scalar(buf);
	}

	export function encode_varint(i : number|string) {
		let j = new JSBigInt(i);
		let out = '';
		// While i >= b10000000
		while (j.compare(0x80) >= 0) {
			// out.append i & b01111111 | b10000000
			out += ("0" + ((j.lowVal() & 0x7f) | 0x80).toString(16)).slice(-2);
			j = j.divide(new JSBigInt(2).pow(7));
		}
		out += ("0" + j.toJSValue().toString(16)).slice(-2);
		return out;
	}

	export function cn_fast_hash(input : string) {
		if (input.length % 2 !== 0 || !CnUtils.valid_hex(input)) {
			throw "Input invalid";
		}
		//update to use new keccak impl (approx 45x faster)
		//let state = this.keccak(input, inlen, HASH_STATE_BYTES);
		//return state.substr(0, HASH_SIZE * 2);
		return keccak_256(CnUtils.hextobin(input));
	}

	export function hex_xor(hex1 : string, hex2 : string) {
		if (!hex1 || !hex2 || hex1.length !== hex2.length || hex1.length % 2 !== 0 || hex2.length % 2 !== 0){throw "Hex string(s) is/are invalid!";}
		let bin1 = hextobin(hex1);
		let bin2 = hextobin(hex2);
		let xor = new Uint8Array(bin1.length);
		for (let i = 0; i < xor.length; i++){
			xor[i] = bin1[i] ^ bin2[i];
		}
		return bintohex(xor);
	}

	export function trimRight(str : string, char : string) {
		while (str[str.length - 1] == char) str = str.slice(0, -1);
		return str;
	}

	export function padLeft(str : string, len : number, char : string) {
		while (str.length < len) {
			str = char + str;
		}
		return str;
	}

	export function ge_double_scalarmult_base_vartime(c : string, P : string, r : string) : string{
		if (c.length !== 64 || P.length !== 64 || r.length !== 64) {
			throw "Invalid input length!";
		}
		return bintohex(nacl.ll.ge_double_scalarmult_base_vartime(hextobin(c), hextobin(P), hextobin(r)));
	}

	export function ge_double_scalarmult_postcomp_vartime(r : string, P : string, c : string, I : string) {
		if (c.length !== 64 || P.length !== 64 || r.length !== 64 || I.length !== 64) {
			throw "Invalid input length!";
		}
		let Pb = CnNativeBride.hash_to_ec_2(P);
		return bintohex(nacl.ll.ge_double_scalarmult_postcomp_vartime(hextobin(r), hextobin(Pb), hextobin(c), hextobin(I)));
	}

	export function decompose_amount_into_digits(amount : number|string) {
		let amountStr = amount.toString();
		let ret = [];
		while (amountStr.length > 0) {
			//split all the way down since v2 fork
			/*let remaining = new JSBigInt(amount);
			 if (remaining.compare(config.dustThreshold) <= 0) {
			 if (remaining.compare(0) > 0) {
			 ret.push(remaining);
			 }
			 break;
			 }*/
			//check so we don't create 0s
			if (amountStr[0] !== "0"){
				let digit = amountStr[0];
				while (digit.length < amountStr.length) {
					digit += "0";
				}
				ret.push(new JSBigInt(digit));
			}
			amount = amountStr.slice(1);
		}
		return ret;
	}

	export function decode_rct_ecdh(ecdh : {mask:string, amount:string}, key : string) {
		let first = Cn.hash_to_scalar(key);
		let second = Cn.hash_to_scalar(first);
		return {
			mask: CnNativeBride.sc_sub(ecdh.mask, first),
			amount: CnNativeBride.sc_sub(ecdh.amount, second),
		};
	}

	export function encode_rct_ecdh(ecdh : {mask:string, amount:string}, key : string) {
		let first = Cn.hash_to_scalar(key);
		let second = Cn.hash_to_scalar(first);
		return {
			mask: CnNativeBride.sc_add(ecdh.mask, first),
			amount: CnNativeBride.sc_add(ecdh.amount, second),
		};
	}
}

export namespace CnNativeBride{
	export function sc_reduce32(hex : string) {
		let input = CnUtils.hextobin(hex);
		if (input.length !== 32) {
			throw "Invalid input length";
		}
		let mem = Module._malloc(32);
		Module.HEAPU8.set(input, mem);
		Module.ccall('sc_reduce32', 'void', ['number'], [mem]);
		let output = Module.HEAPU8.subarray(mem, mem + 32);
		Module._free(mem);
		return CnUtils.bintohex(output);
	}

	export function derive_secret_key(derivation : string, out_index : number, sec : string) {
		if (derivation.length !== 64 || sec.length !== 64) {
			throw "Invalid input length!";
		}
		let scalar_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		let scalar_b = CnUtils.hextobin(CnUtils.derivation_to_scalar(derivation, out_index));
		Module.HEAPU8.set(scalar_b, scalar_m);
		let base_m = Module._malloc(KEY_SIZE);
		Module.HEAPU8.set(CnUtils.hextobin(sec), base_m);
		let derived_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		Module.ccall("sc_add", "void", ["number", "number", "number"], [derived_m, base_m, scalar_m]);
		let res = Module.HEAPU8.subarray(derived_m, derived_m + STRUCT_SIZES.EC_SCALAR);
		Module._free(scalar_m);
		Module._free(base_m);
		Module._free(derived_m);
		return CnUtils.bintohex(res);
	}

	export function hash_to_ec(key : string) {
		if (key.length !== (KEY_SIZE * 2)) {
			throw "Invalid input length";
		}
		let h_m = Module._malloc(HASH_SIZE);
		let point_m = Module._malloc(STRUCT_SIZES.GE_P2);
		let point2_m = Module._malloc(STRUCT_SIZES.GE_P1P1);
		let res_m = Module._malloc(STRUCT_SIZES.GE_P3);
		let hash = CnUtils.hextobin(CnUtils.cn_fast_hash(key));
		Module.HEAPU8.set(hash, h_m);
		Module.ccall("ge_fromfe_frombytes_vartime", "void", ["number", "number"], [point_m, h_m]);
		Module.ccall("ge_mul8", "void", ["number", "number"], [point2_m, point_m]);
		Module.ccall("ge_p1p1_to_p3", "void", ["number", "number"], [res_m, point2_m]);
		let res = Module.HEAPU8.subarray(res_m, res_m + STRUCT_SIZES.GE_P3);
		Module._free(h_m);
		Module._free(point_m);
		Module._free(point2_m);
		Module._free(res_m);
		return CnUtils.bintohex(res);
	}

	//returns a 32 byte point via "ge_p3_tobytes" rather than a 160 byte "p3", otherwise same as above;
	export function hash_to_ec_2(key : string) {
		if (key.length !== (KEY_SIZE * 2)) {
			throw "Invalid input length";
		}
		let h_m = Module._malloc(HASH_SIZE);
		let point_m = Module._malloc(STRUCT_SIZES.GE_P2);
		let point2_m = Module._malloc(STRUCT_SIZES.GE_P1P1);
		let res_m = Module._malloc(STRUCT_SIZES.GE_P3);
		let hash = CnUtils.hextobin(CnUtils.cn_fast_hash(key));
		let res2_m = Module._malloc(KEY_SIZE);
		Module.HEAPU8.set(hash, h_m);
		Module.ccall("ge_fromfe_frombytes_vartime", "void", ["number", "number"], [point_m, h_m]);
		Module.ccall("ge_mul8", "void", ["number", "number"], [point2_m, point_m]);
		Module.ccall("ge_p1p1_to_p3", "void", ["number", "number"], [res_m, point2_m]);
		Module.ccall("ge_p3_tobytes", "void", ["number", "number"], [res2_m, res_m]);
		let res = Module.HEAPU8.subarray(res2_m, res2_m + KEY_SIZE);
		Module._free(h_m);
		Module._free(point_m);
		Module._free(point2_m);
		Module._free(res_m);
		Module._free(res2_m);
		return CnUtils.bintohex(res);
	}

	export function generate_key_image_2(pub : string, sec : string) {
		if (!pub || !sec || pub.length !== 64 || sec.length !== 64) {
			throw "Invalid input length";
		}
		let pub_m = Module._malloc(KEY_SIZE);
		let sec_m = Module._malloc(KEY_SIZE);
		Module.HEAPU8.set(CnUtils.hextobin(pub), pub_m);
		Module.HEAPU8.set(CnUtils.hextobin(sec), sec_m);
		if (Module.ccall("sc_check", "number", ["number"], [sec_m]) !== 0) {
			throw "sc_check(sec) != 0";
		}
		let point_m = Module._malloc(STRUCT_SIZES.GE_P3);
		let point2_m = Module._malloc(STRUCT_SIZES.GE_P2);
		let point_b = CnUtils.hextobin(CnNativeBride.hash_to_ec(pub));
		Module.HEAPU8.set(point_b, point_m);
		let image_m = Module._malloc(STRUCT_SIZES.KEY_IMAGE);
		Module.ccall("ge_scalarmult", "void", ["number", "number", "number"], [point2_m, sec_m, point_m]);
		Module.ccall("ge_tobytes", "void", ["number", "number"], [image_m, point2_m]);
		let res = Module.HEAPU8.subarray(image_m, image_m + STRUCT_SIZES.KEY_IMAGE);
		Module._free(pub_m);
		Module._free(sec_m);
		Module._free(point_m);
		Module._free(point2_m);
		Module._free(image_m);
		return CnUtils.bintohex(res);
	}

	//adds two scalars together
	export function sc_add(scalar1 : string, scalar2 : string) {
		if (scalar1.length !== 64 || scalar2.length !== 64) {
			throw "Invalid input length!";
		}
		let scalar1_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		let scalar2_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		Module.HEAPU8.set(CnUtils.hextobin(scalar1), scalar1_m);
		Module.HEAPU8.set(CnUtils.hextobin(scalar2), scalar2_m);
		let derived_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		Module.ccall("sc_add", "void", ["number", "number", "number"], [derived_m, scalar1_m, scalar2_m]);
		let res = Module.HEAPU8.subarray(derived_m, derived_m + STRUCT_SIZES.EC_SCALAR);
		Module._free(scalar1_m);
		Module._free(scalar2_m);
		Module._free(derived_m);
		return CnUtils.bintohex(res);
	}

	//subtracts one scalar from another
	export function sc_sub(scalar1 : string, scalar2 : string) {
		if (scalar1.length !== 64 || scalar2.length !== 64) {
			throw "Invalid input length!";
		}
		let scalar1_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		let scalar2_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		Module.HEAPU8.set(CnUtils.hextobin(scalar1), scalar1_m);
		Module.HEAPU8.set(CnUtils.hextobin(scalar2), scalar2_m);
		let derived_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		Module.ccall("sc_sub", "void", ["number", "number", "number"], [derived_m, scalar1_m, scalar2_m]);
		let res = Module.HEAPU8.subarray(derived_m, derived_m + STRUCT_SIZES.EC_SCALAR);
		Module._free(scalar1_m);
		Module._free(scalar2_m);
		Module._free(derived_m);
		return CnUtils.bintohex(res);
	}

	//res = c - (ab) mod l; argument names copied from the signature implementation
	export function sc_mulsub(sigc : string, sec : string, k : string) {
		if (k.length !== KEY_SIZE * 2 || sigc.length !== KEY_SIZE * 2 || sec.length !== KEY_SIZE * 2 || !CnUtils.valid_hex(k) || !CnUtils.valid_hex(sigc) || !CnUtils.valid_hex(sec)) {
			throw "bad scalar";
		}
		let sec_m = Module._malloc(KEY_SIZE);
		Module.HEAPU8.set(CnUtils.hextobin(sec), sec_m);
		let sigc_m = Module._malloc(KEY_SIZE);
		Module.HEAPU8.set(CnUtils.hextobin(sigc), sigc_m);
		let k_m = Module._malloc(KEY_SIZE);
		Module.HEAPU8.set(CnUtils.hextobin(k), k_m);
		let res_m = Module._malloc(KEY_SIZE);

		Module.ccall("sc_mulsub", "void", ["number", "number", "number", "number"], [res_m, sigc_m, sec_m, k_m]);
		let res = Module.HEAPU8.subarray(res_m, res_m + KEY_SIZE);
		Module._free(k_m);
		Module._free(sec_m);
		Module._free(sigc_m);
		Module._free(res_m);
		return CnUtils.bintohex(res);
	}



	export function generate_ring_signature(prefix_hash : string, k_image : string, keys : string[], sec : string, real_index : number) {
		if (k_image.length !== STRUCT_SIZES.KEY_IMAGE * 2) {
			throw "invalid key image length";
		}
		if (sec.length !== KEY_SIZE * 2) {
			throw "Invalid secret key length";
		}
		if (prefix_hash.length !== HASH_SIZE * 2 || !CnUtils.valid_hex(prefix_hash)) {
			throw "Invalid prefix hash";
		}
		if (real_index >= keys.length || real_index < 0) {
			throw "real_index is invalid";
		}
		let _ge_tobytes = Module.cwrap("ge_tobytes", "void", ["number", "number"]);
		let _ge_p3_tobytes = Module.cwrap("ge_p3_tobytes", "void", ["number", "number"]);
		let _ge_scalarmult_base = Module.cwrap("ge_scalarmult_base", "void", ["number", "number"]);
		let _ge_scalarmult = Module.cwrap("ge_scalarmult", "void", ["number", "number", "number"]);
		let _sc_add = Module.cwrap("sc_add", "void", ["number", "number", "number"]);
		let _sc_sub = Module.cwrap("sc_sub", "void", ["number", "number", "number"]);
		let _sc_mulsub = Module.cwrap("sc_mulsub", "void", ["number", "number", "number", "number"]);
		let _sc_0 = Module.cwrap("sc_0", "void", ["number"]);
		let _ge_double_scalarmult_base_vartime = Module.cwrap("ge_double_scalarmult_base_vartime", "void", ["number", "number", "number", "number"]);
		let _ge_double_scalarmult_precomp_vartime = Module.cwrap("ge_double_scalarmult_precomp_vartime", "void", ["number", "number", "number", "number", "number"]);
		let _ge_frombytes_vartime = Module.cwrap("ge_frombytes_vartime", "number", ["number", "number"]);
		let _ge_dsm_precomp = Module.cwrap("ge_dsm_precomp", "void", ["number", "number"]);

		let buf_size = STRUCT_SIZES.EC_POINT * 2 * keys.length;
		let buf_m = Module._malloc(buf_size);
		let sig_size = STRUCT_SIZES.SIGNATURE * keys.length;
		let sig_m = Module._malloc(sig_size);

		// Struct pointer helper functions
		function buf_a(i : number) {
			return buf_m + STRUCT_SIZES.EC_POINT * (2 * i);
		}
		function buf_b(i : number) {
			return buf_m + STRUCT_SIZES.EC_POINT * (2 * i + 1);
		}
		function sig_c(i : number) {
			return sig_m + STRUCT_SIZES.EC_SCALAR * (2 * i);
		}
		function sig_r(i : number) {
			return sig_m + STRUCT_SIZES.EC_SCALAR * (2 * i + 1);
		}
		let image_m = Module._malloc(STRUCT_SIZES.KEY_IMAGE);
		Module.HEAPU8.set(CnUtils.hextobin(k_image), image_m);
		let i;
		let image_unp_m = Module._malloc(STRUCT_SIZES.GE_P3);
		let image_pre_m = Module._malloc(STRUCT_SIZES.GE_DSMP);
		let sum_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		let k_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		let h_m = Module._malloc(STRUCT_SIZES.EC_SCALAR);
		let tmp2_m = Module._malloc(STRUCT_SIZES.GE_P2);
		let tmp3_m = Module._malloc(STRUCT_SIZES.GE_P3);
		let pub_m = Module._malloc(KEY_SIZE);
		let sec_m = Module._malloc(KEY_SIZE);
		Module.HEAPU8.set(CnUtils.hextobin(sec), sec_m);
		if (_ge_frombytes_vartime(image_unp_m, image_m) != 0) {
			throw "failed to call ge_frombytes_vartime";
		}
		_ge_dsm_precomp(image_pre_m, image_unp_m);
		_sc_0(sum_m);
		for (i = 0; i < keys.length; i++) {
			if (i === real_index) {
				// Real key
				let rand = CnRandom.random_scalar();
				Module.HEAPU8.set(CnUtils.hextobin(rand), k_m);
				_ge_scalarmult_base(tmp3_m, k_m);
				_ge_p3_tobytes(buf_a(i), tmp3_m);
				let ec = CnNativeBride.hash_to_ec(keys[i]);
				Module.HEAPU8.set(CnUtils.hextobin(ec), tmp3_m);
				_ge_scalarmult(tmp2_m, k_m, tmp3_m);
				_ge_tobytes(buf_b(i), tmp2_m);
			} else {
				Module.HEAPU8.set(CnUtils.hextobin(CnRandom.random_scalar()), sig_c(i));
				Module.HEAPU8.set(CnUtils.hextobin(CnRandom.random_scalar()), sig_r(i));
				Module.HEAPU8.set(CnUtils.hextobin(keys[i]), pub_m);
				if (Module.ccall("ge_frombytes_vartime", "void", ["number", "number"], [tmp3_m, pub_m]) !== 0) {
					throw "Failed to call ge_frombytes_vartime";
				}
				_ge_double_scalarmult_base_vartime(tmp2_m, sig_c(i), tmp3_m, sig_r(i));
				_ge_tobytes(buf_a(i), tmp2_m);
				let ec = CnNativeBride.hash_to_ec(keys[i]);
				Module.HEAPU8.set(CnUtils.hextobin(ec), tmp3_m);
				_ge_double_scalarmult_precomp_vartime(tmp2_m, sig_r(i), tmp3_m, sig_c(i), image_pre_m);
				_ge_tobytes(buf_b(i), tmp2_m);
				_sc_add(sum_m, sum_m, sig_c(i));
			}
		}
		let buf_bin = Module.HEAPU8.subarray(buf_m, buf_m + buf_size);
		let scalar = Cn.hash_to_scalar(prefix_hash + CnUtils.bintohex(buf_bin));
		Module.HEAPU8.set(CnUtils.hextobin(scalar), h_m);
		_sc_sub(sig_c(real_index), h_m, sum_m);
		_sc_mulsub(sig_r(real_index), sig_c(real_index), sec_m, k_m);
		let sig_data = CnUtils.bintohex(Module.HEAPU8.subarray(sig_m, sig_m + sig_size));
		let sigs = [];
		for (let k = 0; k < keys.length; k++) {
			sigs.push(sig_data.slice(STRUCT_SIZES.SIGNATURE * 2 * k, STRUCT_SIZES.SIGNATURE * 2 * (k + 1)));
		}
		Module._free(image_m);
		Module._free(image_unp_m);
		Module._free(image_pre_m);
		Module._free(sum_m);
		Module._free(k_m);
		Module._free(h_m);
		Module._free(tmp2_m);
		Module._free(tmp3_m);
		Module._free(buf_m);
		Module._free(sig_m);
		Module._free(pub_m);
		Module._free(sec_m);
		return sigs;
	}

	export function generate_key_derivation(pub : any, sec : any){
		let generate_key_derivation_bind = (<any>self).Module_native.cwrap('generate_key_derivation', null, ['number', 'number', 'number']);

		let pub_b = CnUtils.hextobin(pub);
		let sec_b = CnUtils.hextobin(sec);
		let Module_native = (<any>self).Module_native;

		let pub_m = Module_native._malloc(KEY_SIZE);
		Module_native.HEAPU8.set(pub_b, pub_m);

		let sec_m = Module_native._malloc(KEY_SIZE);
		Module_native.HEAPU8.set(sec_b, sec_m);

		let derivation_m = Module_native._malloc(KEY_SIZE);
		let r = generate_key_derivation_bind(pub_m,sec_m,derivation_m);

		Module_native._free(pub_m);
		Module_native._free(sec_m);

		let res = Module_native.HEAPU8.subarray(derivation_m, derivation_m + KEY_SIZE);
		Module_native._free(derivation_m);

		return CnUtils.bintohex(res);
	}

	export function derive_public_key(derivation : string,
		output_idx_in_tx : number,
		pubSpend : string){
		let derive_public_key_bind = (<any>self).Module_native.cwrap('derive_public_key', null, ['number', 'number', 'number', 'number']);

		let derivation_b = CnUtils.hextobin(derivation);
		let pub_spend_b = CnUtils.hextobin(pubSpend);


		let Module_native = (<any>self).Module_native;

		let derivation_m = Module_native._malloc(KEY_SIZE);
		Module_native.HEAPU8.set(derivation_b, derivation_m);

		let pub_spend_m = Module_native._malloc(KEY_SIZE);
		Module_native.HEAPU8.set(pub_spend_b, pub_spend_m);

		let derived_key_m = Module_native._malloc(KEY_SIZE);
		let r = derive_public_key_bind(derivation_m, output_idx_in_tx, pub_spend_m, derived_key_m);

		Module_native._free(derivation_m);
		Module_native._free(pub_spend_m);

		let res = Module_native.HEAPU8.subarray(derived_key_m, derived_key_m + KEY_SIZE);
		Module_native._free(derived_key_m);

		return CnUtils.bintohex(res);
	}
}

export namespace Cn{

	export function hash_to_scalar(buf : string) : string{
		let hash = CnUtils.cn_fast_hash(buf);
		let scalar = CnNativeBride.sc_reduce32(hash);
		return scalar;
	}

	export function array_hash_to_scalar(array : string[]) : string{
		let buf = "";
		for (let i = 0; i < array.length; i++){
			if (typeof array[i] !== "string"){throw "unexpected array element";}
			buf += array[i];
		}
		return hash_to_scalar(buf);
	}

	/**
	 * @deprecated CnNativeBride has a much faster version
	 * @param pub
	 * @param sec
	 */
	export function generate_key_derivation(pub : string, sec : string) {
		if (pub.length !== 64 || sec.length !== 64) {
			throw "Invalid input length";
		}
		let P = CnUtils.ge_scalarmult(pub, sec);
		return CnUtils.ge_scalarmult(P, CnUtils.d2s(8)); //mul8 to ensure group
	}

	/**
	 * @deprecated CnNativeBride has a much faster version
	 * @param derivation
	 * @param out_index
	 * @param pub
	 */
	export function derive_public_key(derivation : string, out_index : number, pub : string) {
		if (derivation.length !== 64 || pub.length !== 64) {
			throw "Invalid input length!";
		}
		let s = CnUtils.derivation_to_scalar(derivation, out_index);
		return CnUtils.bintohex(nacl.ll.ge_add(CnUtils.hextobin(pub), CnUtils.hextobin(CnUtils.ge_scalarmult_base(s))));
	}

	export function generate_keys(seed : string) {
		if (seed.length !== 64) throw "Invalid input length!";
		let sec = CnNativeBride.sc_reduce32(seed);
		let pub = CnUtils.sec_key_to_pub(sec);
		return {
			'sec': sec,
			'pub': pub
		};
	}

	export function random_keypair() {
		return Cn.generate_keys(CnRandom.rand_32());
	}

	export function pubkeys_to_string(spend : string, view : string) {
		let prefix = CnUtils.encode_varint(CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX);
		let data = prefix + spend + view;
		let checksum = CnUtils.cn_fast_hash(data);
		return cnBase58.encode(data + checksum.slice(0, ADDRESS_CHECKSUM_SIZE * 2));
	}
	
	export function create_address(seed : string) : {
		spend:{
			sec:string,
			pub:string
		},
		view:{
			sec:string,
			pub:string
		},
		public_addr:string
	}{
		let keys = {
			spend:{
				sec:'',
				pub:''
			},
			view:{
				sec:'',
				pub:''
			},
			public_addr:''
		};
		let first;
		if (seed.length !== 64) {
			first = CnUtils.cn_fast_hash(seed);
		} else {
			first = seed; //only input reduced seeds or this will not give you the result you want
		}

		keys.spend = Cn.generate_keys(first);
		let second = seed.length !== 64 ? CnUtils.cn_fast_hash(first) : CnUtils.cn_fast_hash(keys.spend.sec);
		keys.view = Cn.generate_keys(second);
		keys.public_addr = Cn.pubkeys_to_string(keys.spend.pub, keys.view.pub);
		return keys;
	}

	export function decode_address(address : string) : {
		spend: string,
		view: string,
		intPaymentId: string|null
	}{
		let dec = cnBase58.decode(address);
		console.log(dec,CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX,CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX);
		let expectedPrefix = CnUtils.encode_varint(CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX);
		let expectedPrefixInt = CnUtils.encode_varint(CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX);
		let expectedPrefixSub = CnUtils.encode_varint(CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX);
		let prefix = dec.slice(0, expectedPrefix.length);
		console.log(prefix,expectedPrefixInt,expectedPrefix);
		if (prefix !== expectedPrefix && prefix !== expectedPrefixInt && prefix !== expectedPrefixSub) {
			throw "Invalid address prefix";
		}
		dec = dec.slice(expectedPrefix.length);
		let spend = dec.slice(0, 64);
		let view = dec.slice(64, 128);
		let checksum : string|null = null;
		let expectedChecksum : string|null = null;
		let intPaymentId : string|null = null;
		if (prefix === expectedPrefixInt){
			let intPaymentId = dec.slice(128, 128 + (INTEGRATED_ID_SIZE * 2));
			checksum = dec.slice(128 + (INTEGRATED_ID_SIZE * 2), 128 + (INTEGRATED_ID_SIZE * 2) + (ADDRESS_CHECKSUM_SIZE * 2));
			expectedChecksum = CnUtils.cn_fast_hash(prefix + spend + view + intPaymentId).slice(0, ADDRESS_CHECKSUM_SIZE * 2);
		} else {
			checksum = dec.slice(128, 128 + (ADDRESS_CHECKSUM_SIZE * 2));
			expectedChecksum = CnUtils.cn_fast_hash(prefix + spend + view).slice(0, ADDRESS_CHECKSUM_SIZE * 2);
		}
		if (checksum !== expectedChecksum) {
			throw "Invalid checksum";
		}

		return {
			spend: spend,
			view: view,
			intPaymentId: intPaymentId
		};
	}

	export function is_subaddress(addr : string) {
		let decoded = cnBase58.decode(addr);
		let subaddressPrefix = CnUtils.encode_varint(CRYPTONOTE_PUBLIC_SUBADDRESS_BASE58_PREFIX);
		let prefix = decoded.slice(0, subaddressPrefix.length);

		return (prefix === subaddressPrefix);
	}

	export function valid_keys(view_pub : string, view_sec : string, spend_pub : string, spend_sec : string) {
		let expected_view_pub = CnUtils.sec_key_to_pub(view_sec);
		let expected_spend_pub = CnUtils.sec_key_to_pub(spend_sec);
		return (expected_spend_pub === spend_pub) && (expected_view_pub === view_pub);
	}

	export function decrypt_payment_id(payment_id8 : string, tx_public_key : string, acc_prv_view_key : string) {
		if (payment_id8.length !== 16) throw "Invalid input length2!";

		let key_derivation = Cn.generate_key_derivation(tx_public_key, acc_prv_view_key);

		let pid_key = CnUtils.cn_fast_hash(key_derivation + ENCRYPTED_PAYMENT_ID_TAIL.toString(16)).slice(0, INTEGRATED_ID_SIZE * 2);

		let decrypted_payment_id = CnUtils.hex_xor(payment_id8, pid_key);

		return decrypted_payment_id;
	}

	export function get_account_integrated_address(address : string, payment_id8 : string) {
		let decoded_address = decode_address(address);

		let prefix = CnUtils.encode_varint(CRYPTONOTE_PUBLIC_INTEGRATED_ADDRESS_BASE58_PREFIX);
		let data = prefix + decoded_address.spend  + decoded_address.view + payment_id8;

		let checksum = CnUtils.cn_fast_hash(data);

		return cnBase58.encode(data + checksum.slice(0, ADDRESS_CHECKSUM_SIZE * 2));
	}

	export function formatMoneyFull(units : number|string) {
		let unitsStr = (units).toString();
		let symbol = unitsStr[0] === '-' ? '-' : '';
		if (symbol === '-') {
			unitsStr = unitsStr.slice(1);
		}
		let decimal;
		if (unitsStr.length >= config.coinUnitPlaces) {
			decimal = unitsStr.substr(unitsStr.length - config.coinUnitPlaces, config.coinUnitPlaces);
		} else {
			decimal = CnUtils.padLeft(unitsStr, config.coinUnitPlaces, '0');
		}
		return symbol + (unitsStr.substr(0, unitsStr.length - config.coinUnitPlaces) || '0') + '.' + decimal;
	}

	export function formatMoneyFullSymbol(units : number|string) {
		return Cn.formatMoneyFull(units) + ' ' + config.coinSymbol;
	}

	export function formatMoney(units : number|string) {
		let f = CnUtils.trimRight(Cn.formatMoneyFull(units), '0');
		if (f[f.length - 1] === '.') {
			return f.slice(0, f.length - 1);
		}
		return f;
	}

	export function formatMoneySymbol(units : number|string) {
		return Cn.formatMoney(units) + ' ' + config.coinSymbol;
	}

}

export namespace CnTransactions{

	export function commit(amount : string, mask : string){
		if (!CnUtils.valid_hex(mask) || mask.length !== 64 || !CnUtils.valid_hex(amount) || amount.length !== 64){
			throw "invalid amount or mask!";
		}
		let C = CnUtils.ge_double_scalarmult_base_vartime(amount, CnVars.H, mask);
		return C;
	}

	export function zeroCommit(amount : string){
		if (!CnUtils.valid_hex(amount) || amount.length !== 64){
			throw "invalid amount!";
		}
		let C = CnUtils.ge_double_scalarmult_base_vartime(amount, CnVars.H, CnVars.I);
		return C;
	}

	export function decodeRctSimple(rv : any, sk  :any, i : number, mask : any, hwdev : any=null) {
		// CHECK_AND_ASSERT_MES(rv.type == RCTTypeSimple || rv.type == RCTTypeSimpleBulletproof, false, "decodeRct called on non simple rctSig");
		// CHECK_AND_ASSERT_THROW_MES(i < rv.ecdhInfo.size(), "Bad index");
		// CHECK_AND_ASSERT_THROW_MES(rv.outPk.size() == rv.ecdhInfo.size(), "Mismatched sizes of rv.outPk and rv.ecdhInfo");
// console.log(i < rv.ecdhInfo.length ? undefined : 'Bad index');
// console.log(rv.outPk.length == rv.ecdhInfo.length ? undefined : 'Mismatched sizes of rv.outPk and rv.ecdhInfo');

		//mask amount and mask
		// console.log('decode',rv.ecdhInfo[i], sk, h2d(rv.ecdhInfo[i].amount));
		let ecdh_info = CnUtils.decode_rct_ecdh(rv.ecdhInfo[i], sk);
		// console.log('ecdh_info',ecdh_info);
		// mask = ecdh_info.mask;
		let amount = ecdh_info.amount;
		let C = rv.outPk[i].mask;

		// console.log('amount', amount);
		// console.log('C', C);
		// DP("C");
		// DP(C);
		// key Ctmp;
		// addKeys2(Ctmp, mask, amount, H);
		// DP("Ctmp");
		// DP(Ctmp);
		// if (equalKeys(C, Ctmp) == false) {
		// 	CHECK_AND_ASSERT_THROW_MES(false, "warning, amount decoded incorrectly, will be unable to spend");
		// }

		return CnUtils.h2d(amount);
	}

	export function decode_ringct(rv:any,
		pub : any,
		sec : any,
		i : number,
		mask : any,
		amount : any,
		derivation : string|null) : number|false
	{
		if(derivation===null)
			derivation = Cn.generate_key_derivation(pub, sec);//[10;11]ms

		let scalar1 = CnUtils.derivation_to_scalar(derivation, i);//[0.2ms;1ms]

		try
		{
			// console.log(rv.type,'RCTTypeSimple='+RCTTypeSimple,'RCTTypeFull='+RCTTypeFull);
			switch (rv.type)
			{
				case CnVars.RCT_TYPE.Simple:
					amount = CnTransactions.decodeRctSimple(rv,
						scalar1,
						i,
						mask);//[5;10]ms
					break;
				case CnVars.RCT_TYPE.Full:
					// console.log('RCTTypeSimple');
					amount = CnTransactions.decodeRctSimple(rv,
						scalar1,
						i,
						mask);
					break;
				default:
					console.log('Unsupported rc type', rv.type);
					// cerr << "Unsupported rct type: " << rv.type << endl;
					return false;
			}
		}
		catch (e)
		{
			console.error(e);
			console.log("Failed to decode input " +i);
			return false;
		}

		return amount;
	}

	export function generate_key_image_helper(ack:{view_secret_key:any,spend_secret_key:string, public_spend_key:string}, tx_public_key:any, real_output_index:any,recv_derivation:string|null)
	{
		if(recv_derivation === null)
		recv_derivation = Cn.generate_key_derivation(tx_public_key, ack.view_secret_key);
			// recv_derivation = CnUtilNative.generate_key_derivation(tx_public_key, ack.view_secret_key);
		// console.log('recv_derivation', recv_derivation);

		// CHECK_AND_ASSERT_MES(r, false, "key image helper: failed to generate_key_derivation(" << tx_public_key << ", " << ack.m_view_secret_key << ")");
		//

		// let start = Date.now();

		let in_ephemeral_pub = Cn.derive_public_key(recv_derivation, real_output_index, ack.public_spend_key);
		// let in_ephemeral_pub = CnUtilNative.derive_public_key(recv_derivation, real_output_index, ack.public_spend_key);
		// console.log('in_ephemeral_pub',in_ephemeral_pub);


		// CHECK_AND_ASSERT_MES(r, false, "key image helper: failed to derive_public_key(" << recv_derivation << ", " << real_output_index <<  ", " << ack.m_account_address.m_spend_public_key << ")");
		//
		let in_ephemeral_sec = CnNativeBride.derive_secret_key(recv_derivation, real_output_index, ack.spend_secret_key);
		// let in_ephemeral_sec = CnNativeBride.derive_secret_key(recv_derivation, real_output_index, ack.spend_secret_key);
		// console.log('in_ephemeral_sec',in_ephemeral_sec);



		// let ki = CnNativeBride.generate_key_image_2(in_ephemeral_pub, in_ephemeral_sec);
		let ki = CnNativeBride.generate_key_image_2(in_ephemeral_pub, in_ephemeral_sec);

		// let end = Date.now();
		// console.log(end-start);

		return {
			ephemeral_pub:in_ephemeral_pub,
			ephemeral_sec:in_ephemeral_sec,
			key_image:ki
		};
	}

	//TODO duplicate above
	export function generate_key_image_helper_rct(keys : {view:{sec:string}, spend:{pub:string,sec:string}}, tx_pub_key : string, out_index : number, enc_mask : string) {
		let recv_derivation = Cn.generate_key_derivation(tx_pub_key, keys.view.sec);
		if (!recv_derivation) throw "Failed to generate key image";

		let mask;

		if (enc_mask === CnVars.I)
		{
			// this is for ringct coinbase txs (rct type 0). they are ringct tx that have identity mask
			mask = enc_mask; // enc_mask is idenity mask returned by backend.
		}
		else
		{
			// for other ringct types or for non-ringct txs to this.
			mask = enc_mask ? CnNativeBride.sc_sub(enc_mask, Cn.hash_to_scalar(CnUtils.derivation_to_scalar(recv_derivation, out_index))) : CnVars.I; //decode mask, or d2s(1) if no mask
		}

		let ephemeral_pub = Cn.derive_public_key(recv_derivation, out_index, keys.spend.pub);
		if (!ephemeral_pub) throw "Failed to generate key image";
		let ephemeral_sec = CnNativeBride.derive_secret_key(recv_derivation, out_index, keys.spend.sec);
		let image = CnNativeBride.generate_key_image_2(ephemeral_pub, ephemeral_sec);
		return {
			in_ephemeral: {
				pub: ephemeral_pub,
				sec: ephemeral_sec,
				mask: mask
			},
			image: image
		};
	}

	export function estimateRctSize(inputs : number, mixin : number, outputs : number) {
		let size = 0;
		size += outputs * 6306;
		size += ((mixin + 1) * 4 + 32 + 8) * inputs; //key offsets + key image + amount
		size += 64 * (mixin + 1) * inputs + 64 * inputs; //signature + pseudoOuts/cc
		size += 74; //extra + whatever, assume long payment ID
		return size;
	}

	export function decompose_tx_destinations(dsts : {address:string, amount:number}[], rct : boolean) : {address:string, amount:number}[] {
		let out = [];
		if (rct) {
			for (let i = 0; i < dsts.length; i++) {
				out.push({
					address: dsts[i].address,
					amount: dsts[i].amount
				});
			}
		} else {
			for (let i = 0; i < dsts.length; i++) {
				let digits = CnUtils.decompose_amount_into_digits(dsts[i].amount);
				for (let j = 0; j < digits.length; j++) {
					if (digits[j].compare(0) > 0) {
						out.push({
							address: dsts[i].address,
							amount: digits[j]
						});
					}
				}
			}
		}
		return out.sort(function(a,b){
			return a["amount"] - b["amount"];
		});
	}

	export function get_payment_id_nonce(payment_id : string, pid_encrypt : boolean) {
		if (payment_id.length !== 64 && payment_id.length !== 16) {
			throw "Invalid payment id";
		}
		let res = '';
		if (pid_encrypt) {
			res += TX_EXTRA_NONCE_TAGS.ENCRYPTED_PAYMENT_ID;
		} else {
			res += TX_EXTRA_NONCE_TAGS.PAYMENT_ID;
		}
		res += payment_id;
		return res;
	}

	export function abs_to_rel_offsets(offsets : number[]) {
		if (offsets.length === 0) return offsets;
		for (let i = offsets.length - 1; i >= 1; --i) {
			offsets[i] = new JSBigInt(offsets[i]).subtract(offsets[i - 1]).toString();
		}
		return offsets;
	}

	//TODO merge
	export function add_pub_key_to_extra(extra : string, pubkey : string) {
		if (pubkey.length !== 64) throw "Invalid pubkey length";
		// Append pubkey tag and pubkey
		extra += TX_EXTRA_TAGS.PUBKEY + pubkey;
		return extra;
	}
	//TODO merge
	export function add_nonce_to_extra(extra : string, nonce : string) {
		// Append extra nonce
		if ((nonce.length % 2) !== 0) {
			throw "Invalid extra nonce";
		}
		if ((nonce.length / 2) > TX_EXTRA_NONCE_MAX_COUNT) {
			throw "Extra nonce must be at most " + TX_EXTRA_NONCE_MAX_COUNT + " bytes";
		}
		// Add nonce tag
		extra += TX_EXTRA_TAGS.NONCE;
		// Encode length of nonce
		extra += ('0' + (nonce.length / 2).toString(16)).slice(-2);
		// Write nonce
		extra += nonce;
		return extra;
	}

	export type Ephemeral = {
		pub: string,
		sec: string,
		mask: string
	};

	export type Output = {
		index:string,
		key:string,
		commit:string,
	};

	export type Source = {
		outputs:CnTransactions.Output[],
		amount:'',
		real_out_tx_key:string,
		real_out:number,
		real_out_in_tx:number,
		mask:string|null,
		key_image:string,
		in_ephemeral:CnTransactions.Ephemeral,
	};

	export type Destination = {address:string,amount:number};

	export type Vin = {
		type:string,
		amount:string,
		k_image:string,
		key_offsets:any[]
	};

	export type Vout = {
		amount: string,
		target:{
			type: string,
			key: string
		}
	};

	export type EcdhInfo = {
		mask: string,
		amount: string
	}

	export type RctSignature = {
		ecdhInfo:EcdhInfo[]
		outPk:string[],
		pseudoOuts:string[],
		txnFee:string,
		type:number,
		message?: string,
		p?: any,
	}

	export type Transaction = {
		unlock_time: number,
		version: number,
		extra: string,
		prvkey: string,
		vin: Vin[],
		vout: Vout[],
		rct_signatures:RctSignature,
		signatures:any[],
	};

	export function serialize_tx(tx : CnTransactions.Transaction, headeronly : boolean = false) {
		//tx: {
		//  version: uint64,
		//  unlock_time: uint64,
		//  extra: hex,
		//  vin: [{amount: uint64, k_image: hex, key_offsets: [uint64,..]},...],
		//  vout: [{amount: uint64, target: {key: hex}},...],
		//  signatures: [[s,s,...],...]
		//}
		console.log('serialize tx ', JSON.parse(JSON.stringify(tx)));
		let buf = "";
		buf += CnUtils.encode_varint(tx.version);
		buf += CnUtils.encode_varint(tx.unlock_time);
		buf += CnUtils.encode_varint(tx.vin.length);
		let i, j;
		for (i = 0; i < tx.vin.length; i++) {
			let vin = tx.vin[i];
			console.log('start vin', vin);
			switch (vin.type) {
				case "input_to_key":
					buf += "02";
					buf += CnUtils.encode_varint(vin.amount);
					buf += CnUtils.encode_varint(vin.key_offsets.length);
					console.log(vin.key_offsets,vin.key_offsets.length);
					for (j = 0; j < vin.key_offsets.length; j++) {
						console.log(j, vin.key_offsets[j]);
						buf += CnUtils.encode_varint(vin.key_offsets[j]);
					}
					buf += vin.k_image;
					break;
				default:
					throw "Unhandled vin type: " + vin.type;
			}
			console.log('end vin', vin);
		}
		console.log('serialize tx ', tx);
		buf += CnUtils.encode_varint(tx.vout.length);
		for (i = 0; i < tx.vout.length; i++) {
			let vout = tx.vout[i];
			buf += CnUtils.encode_varint(vout.amount);
			switch (vout.target.type) {
				case "txout_to_key":
					buf += "02";
					buf += vout.target.key;
					break;
				default:
					throw "Unhandled txout target type: " + vout.target.type;
			}
		}
		console.log('serialize tx ', tx);

		if (!CnUtils.valid_hex(tx.extra)) {
			throw "Tx extra has invalid hex";
		}
		console.log('serialize tx ', tx);

		buf += CnUtils.encode_varint(tx.extra.length / 2);
		buf += tx.extra;
		if (!headeronly) {
			if (tx.vin.length !== tx.signatures.length) {
				throw "Signatures length != vin length";
			}
			for (i = 0; i < tx.vin.length; i++) {
				for (j = 0; j < tx.signatures[i].length; j++) {
					buf += tx.signatures[i][j];
				}
			}
		}
		console.log('serialize tx ', buf);
		return buf;
	}


	export function serialize_rct_tx_with_hash(tx : CnTransactions.Transaction) {
		let hashes = "";
		let buf = "";
		buf += CnTransactions.serialize_tx(tx, true);
		hashes += CnUtils.cn_fast_hash(buf);
		let buf2 = CnTransactions.serialize_rct_base(tx.rct_signatures);
		hashes += CnUtils.cn_fast_hash(buf2);
		buf += buf2;
		let buf3 = serialize_range_proofs(tx.rct_signatures);
		//add MGs
		for (let i = 0; i < tx.rct_signatures.p.MGs.length; i++) {
			for (let j = 0; j < tx.rct_signatures.p.MGs[i].ss.length; j++) {
				buf3 += tx.rct_signatures.p.MGs[i].ss[j][0];
				buf3 += tx.rct_signatures.p.MGs[i].ss[j][1];
			}
			buf3 += tx.rct_signatures.p.MGs[i].cc;
		}
		hashes += CnUtils.cn_fast_hash(buf3);
		buf += buf3;
		let hash = CnUtils.cn_fast_hash(hashes);
		return {
			raw: buf,
			hash: hash,
			prvkey: tx.prvkey
		};
	}
	
	export function get_tx_prefix_hash(tx : CnTransactions.Transaction) {
		let prefix = CnTransactions.serialize_tx(tx, true);
		return CnUtils.cn_fast_hash(prefix);
	}

	//xv: vector of secret keys, 1 per ring (nrings)
	//pm: matrix of pubkeys, indexed by size first
	//iv: vector of indexes, 1 per ring (nrings), can be a string
	//size: ring size
	//nrings: number of rings
	//extensible borromean signatures
	export function genBorromean(xv : string[], pm : string[][], iv : string, size : number, nrings : number){
		if (xv.length !== nrings){
			throw "wrong xv length " + xv.length;
		}
		if (pm.length !== size){
			throw "wrong pm size " + pm.length;
		}
		for (let i = 0; i < pm.length; i++){
			if (pm[i].length !== nrings){
				throw "wrong pm[" + i + "] length " + pm[i].length;
			}
		}
		if (iv.length !== nrings){
			throw "wrong iv length " + iv.length;
		}
		for (let i = 0; i < iv.length; i++){
			if (parseInt(iv[i]) >= size){
				throw "bad indices value at: " + i + ": " + iv[i];
			}
		}
		//signature struct
		let bb : {
			s: string[][],
			ee:string
		} = {
			s: [],
			ee: ""
		};
		//signature pubkey matrix
		let L : string[][] = [];
		//add needed sub vectors (1 per ring size)
		for (let i = 0; i < size; i++){
			bb.s[i] = [];
			L[i] = [];
		}
		//compute starting at the secret index to the last row
		let index;
		let alpha = [];
		for (let i = 0; i < nrings; i++){
			index = parseInt(''+iv[i]);
			alpha[i] = CnRandom.random_scalar();
			L[index][i] = CnUtils.ge_scalarmult_base(alpha[i]);
			for (let j = index + 1; j < size; j++){
				bb.s[j][i] = CnRandom.random_scalar();
				let c = Cn.hash_to_scalar(L[j-1][i]);
				L[j][i] = CnUtils.ge_double_scalarmult_base_vartime(c, pm[j][i], bb.s[j][i]);
			}
		}
		//hash last row to create ee
		let ltemp = "";
		for (let i = 0; i < nrings; i++){
			ltemp += L[size-1][i];
		}
		bb.ee = Cn.hash_to_scalar(ltemp);
		//compute the rest from 0 to secret index
		for (let i = 0; i < nrings; i++){
			let cc = bb.ee;
			let j = 0;
			for (j = 0; j < parseInt(iv[i]); j++){
				bb.s[j][i] = CnRandom.random_scalar();
				let LL = CnUtils.ge_double_scalarmult_base_vartime(cc, pm[j][i], bb.s[j][i]);
				cc = Cn.hash_to_scalar(LL);
			}
			bb.s[j][i] = CnNativeBride.sc_mulsub(xv[i], cc, alpha[i]);
		}
		return bb;
	}

	//proveRange gives C, and mask such that \sumCi = C
	//   c.f. http://eprint.iacr.org/2015/1098 section 5.1
	//   and Ci is a commitment to either 0 or s^i, i=0,...,n
	//   thus this proves that "amount" is in [0, s^n] (we assume s to be 4) (2 for now with v2 txes)
	//   mask is a such that C = aG + bH, and b = amount
	//commitMaskObj = {C: commit, mask: mask}
	export function proveRange(commitMaskObj : {C:string,mask:string}, amount : string, nrings : number, enc_seed : number, exponent : number){
		let size = 2;
		let C = CnVars.I; //identity
		let mask = CnVars.Z; //zero scalar
		let indices = CnUtils.d2b(amount); //base 2 for now
		let sig : {
			Ci:string[],
			bsig:{
				s: string[][],
				ee:string
			}
		}= {
			Ci: [],
			bsig:{
				s:[],
				ee:''
			}
			//exp: exponent //doesn't exist for now
		};
		/*payload stuff - ignore for now
		seeds = new Array(3);
		for (let i = 0; i < seeds.length; i++){
		  seeds[i] = new Array(1);
		}
		genSeeds(seeds, enc_seed);
		*/
		let ai = [];
		let PM : string[][]= [];
		for (let i = 0; i < size; i++){
			PM[i] = [];
		}
		//start at index and fill PM left and right -- PM[0] holds Ci
		for (let i = 0; i < nrings; i++){
			ai[i] = CnRandom.random_scalar();
			let j : number = parseInt(indices[i]);
			PM[j][i] = CnUtils.ge_scalarmult_base(ai[i]);
			while (j > 0){
				j--;
				PM[j][i] = CnUtils.ge_add(PM[j+1][i], CnVars.H2[i]); //will need to use i*2 for base 4 (or different object)
			}
			j = parseInt(indices[i]);
			while (j < size - 1){
				j++;
				PM[j][i] = CnUtils.ge_sub(PM[j-1][i], CnVars.H2[i]); //will need to use i*2 for base 4 (or different object)
			}
			mask = CnNativeBride.sc_add(mask, ai[i]);
		}
		/*
		* some more payload stuff here
		*/
		//copy commitments to sig and sum them to commitment
		for (let i = 0; i < nrings; i++){
			//if (i < nrings - 1) //for later version
			sig.Ci[i] = PM[0][i];
			C = CnUtils.ge_add(C, PM[0][i]);
		}
		/* exponent stuff - ignore for now
		if (exponent){
		  n = JSBigInt(10);
		  n = n.pow(exponent).toString();
		  mask = sc_mul(mask, d2s(n)); //new sum
		}
		*/
		sig.bsig = CnTransactions.genBorromean(ai, PM, indices, size, nrings);
		commitMaskObj.C = C;
		commitMaskObj.mask = mask;
		return sig;
	}

	// Gen creates a signature which proves that for some column in the keymatrix "pk"
	//   the signer knows a secret key for each row in that column
	// we presently only support matrices of 2 rows (pubkey, commitment)
	// this is a simplied MLSAG_Gen function to reflect that
	// because we don't want to force same secret column for all inputs
	export function MLSAG_Gen(message : string, pk : string[][], xx : string[], kimg : string, index : number){
		let cols = pk.length; //ring size
		if (index >= cols){throw "index out of range";}
		let rows = pk[0].length; //number of signature rows (always 2)
		if (rows !== 2){throw "wrong row count";}
		for (let i = 0; i < cols; i++){
			if (pk[i].length !== rows){throw "pk is not rectangular";}
		}
		if (xx.length !== rows){throw "bad xx size";}

		let c_old = "";
		let alpha = [];

		let rv : {
			ss: string[][],
			cc: string
		} = {
			ss: [],
			cc: ''
		};
		for (let i = 0; i < cols; i++){
			rv.ss[i] = [];
		}
		let toHash = []; //holds 6 elements: message, pubkey, dsRow L, dsRow R, commitment, ndsRow L
		toHash[0] = message;

		//secret index (pubkey section)
		alpha[0] = CnRandom.random_scalar(); //need to save alphas for later
		toHash[1] = pk[index][0]; //secret index pubkey
		toHash[2] = CnUtils.ge_scalarmult_base(alpha[0]); //dsRow L
		toHash[3] = CnNativeBride.generate_key_image_2(pk[index][0], alpha[0]); //dsRow R (key image check)
		//secret index (commitment section)
		alpha[1] = CnRandom.random_scalar();
		toHash[4] = pk[index][1]; //secret index commitment
		toHash[5] = CnUtils.ge_scalarmult_base(alpha[1]); //ndsRow L

		c_old = Cn.array_hash_to_scalar(toHash);

		let i = (index + 1) % cols;
		if (i === 0){
			rv.cc = c_old;
		}
		while (i != index){
			rv.ss[i][0] = CnRandom.random_scalar(); //dsRow ss
			rv.ss[i][1] = CnRandom.random_scalar(); //ndsRow ss

			//!secret index (pubkey section)
			toHash[1] = pk[i][0];
			toHash[2] = CnUtils.ge_double_scalarmult_base_vartime(c_old, pk[i][0], rv.ss[i][0]);
			toHash[3] = CnUtils.ge_double_scalarmult_postcomp_vartime(rv.ss[i][0], pk[i][0], c_old, kimg);
			//!secret index (commitment section)
			toHash[4] = pk[i][1];
			toHash[5] = CnUtils.ge_double_scalarmult_base_vartime(c_old, pk[i][1], rv.ss[i][1]);
			c_old = Cn.array_hash_to_scalar(toHash); //hash to get next column c
			i = (i + 1) % cols;
			if (i === 0){
				rv.cc = c_old;
			}
		}
		for (i = 0; i < rows; i++){
			rv.ss[index][i] = CnNativeBride.sc_mulsub(c_old, xx[i], alpha[i]);
		}
		return rv;
	}

	//prepares for MLSAG_Gen
	export function proveRctMG(message : string, pubs : {dest:string, mask:string}[], inSk : {a:string, x:string}, kimg : string, mask : string, Cout : string, index : number){
		let cols = pubs.length;
		if (cols < 3){throw "cols must be > 2 (mixin)";}
		let xx : string[] = [];
		let PK : string[][] = [];
		//fill pubkey matrix (copy destination, subtract commitments)
		for (let i = 0; i < cols; i++){
			PK[i] = [];
			PK[i][0] = pubs[i].dest;
			PK[i][1] = CnUtils.ge_sub(pubs[i].mask, Cout);
		}
		xx[0] = inSk.x;
		xx[1] = CnNativeBride.sc_sub(inSk.a, mask);
		return CnTransactions.MLSAG_Gen(message, PK, xx, kimg, index);
	}

	export function serialize_rct_base(rv : RctSignature) {
		let buf = "";
		buf += CnUtils.encode_varint(rv.type);
		buf += CnUtils.encode_varint(rv.txnFee);
		if (rv.type === 2) {
			for (let i = 0; i < rv.pseudoOuts.length; i++) {
				buf += rv.pseudoOuts[i];
			}
		}
		if (rv.ecdhInfo.length !== rv.outPk.length) {
			throw "mismatched outPk/ecdhInfo!";
		}
		for (let i = 0; i < rv.ecdhInfo.length; i++) {
			buf += rv.ecdhInfo[i].mask;
			buf += rv.ecdhInfo[i].amount;
		}
		for (let i = 0; i < rv.outPk.length; i++) {
			buf += rv.outPk[i];
		}
		return buf;
	}

	export function serialize_range_proofs(rv : RctSignature) {
		let buf = "";
		for (let i = 0; i < rv.p.rangeSigs.length; i++) {
			for (let j = 0; j < rv.p.rangeSigs[i].bsig.s.length; j++) {
				for (let l = 0; l < rv.p.rangeSigs[i].bsig.s[j].length; l++) {
					buf += rv.p.rangeSigs[i].bsig.s[j][l];
				}
			}
			buf += rv.p.rangeSigs[i].bsig.ee;
			for (let j = 0; j < rv.p.rangeSigs[i].Ci.length; j++) {
				buf += rv.p.rangeSigs[i].Ci[j];
			}
		}
		return buf;
	}

	export function get_pre_mlsag_hash(rv : RctSignature) {
		let hashes = "";
		hashes += rv.message;
		hashes += CnUtils.cn_fast_hash(CnTransactions.serialize_rct_base(rv));
		let buf = CnTransactions.serialize_range_proofs(rv);
		hashes += CnUtils.cn_fast_hash(buf);
		return CnUtils.cn_fast_hash(hashes);
	}

	//message is normal prefix hash
	//inSk is vector of x,a
	//kimg is vector of kimg
	//destinations is vector of pubkeys (we skip and proxy outAmounts instead)
	//inAmounts is vector of strings
	//outAmounts is vector of strings
	//mixRing is matrix of pubkey, commit (dest, mask)
	//amountKeys is vector of scalars
	//indices is vector
	//txnFee is string
	export function genRct(
		message : string,
		inSk : {x:string,a:string}[],
		kimg : string[],
		/*destinations, */inAmounts : string[],
		outAmounts : string[],
		mixRing : {dest:string, mask:string}[][],
		amountKeys : string[],
		indices : number[],
		txnFee : string
	){
		console.log('MIXIN:', mixRing);
		if (outAmounts.length !== amountKeys.length ){throw "different number of amounts/amount_keys";}
		for (let i = 0; i < mixRing.length; i++){
			if (mixRing[i].length <= indices[i]){throw "bad mixRing/index size";}
		}
		if (mixRing.length !== inSk.length){throw "mismatched mixRing/inSk";}
		if (inAmounts.length !== inSk.length){throw "mismatched inAmounts/inSk";}
		if (indices.length !== inSk.length){throw "mismatched indices/inSk";}

		console.log('======t');

		let rv : RctSignature = {
			type: inSk.length === 1 ? CnVars.RCT_TYPE.Full : CnVars.RCT_TYPE.Simple,
			message: message,
			outPk: [],
			p: {
				rangeSigs: [],
				MGs: []
			},
			ecdhInfo: [],
			txnFee: txnFee.toString(),
			pseudoOuts: []
		};

		let sumout = CnVars.Z;
		let cmObj = {
			C: '',
			mask: ''
		};

		console.log('====a');

		let nrings = 64; //for base 2/current
		//compute range proofs, etc
		for (let i = 0; i < outAmounts.length; i++){
			let teststart = new Date().getTime();
			rv.p.rangeSigs[i] = CnTransactions.proveRange(cmObj, outAmounts[i], nrings, 0, 0);
			let testfinish = new Date().getTime() - teststart;
			console.log("Time take for range proof " + i + ": " + testfinish);
			rv.outPk[i] = cmObj.C;
			sumout = CnNativeBride.sc_add(sumout, cmObj.mask);
			rv.ecdhInfo[i] = CnUtils.encode_rct_ecdh({mask: cmObj.mask, amount: CnUtils.d2s(outAmounts[i])}, amountKeys[i]);
		}
		console.log('====a');

		//simple
		console.log('-----------rv type',rv.type);
		if (rv.type === CnVars.RCT_TYPE.Simple){
			let ai = [];
			let sumpouts = CnVars.Z;
			//create pseudoOuts
			let i = 0;
			for (; i < inAmounts.length - 1; i++){
				ai[i] = CnRandom.random_scalar();
				sumpouts = CnNativeBride.sc_add(sumpouts, ai[i]);
				rv.pseudoOuts[i] = commit(CnUtils.d2s(inAmounts[i]), ai[i]);
			}
			ai[i] = CnNativeBride.sc_sub(sumout, sumpouts);
			rv.pseudoOuts[i] = commit(CnUtils.d2s(inAmounts[i]), ai[i]);
			let full_message = CnTransactions.get_pre_mlsag_hash(rv);
			for (let i = 0; i < inAmounts.length; i++){
				rv.p.MGs.push(CnTransactions.proveRctMG(full_message, mixRing[i], inSk[i], kimg[i], ai[i], rv.pseudoOuts[i], indices[i]));
			}
		} else {
			let sumC = CnVars.I;
			//get sum of output commitments to use in MLSAG
			for (let i = 0; i < rv.outPk.length; i++){
				sumC = CnUtils.ge_add(sumC, rv.outPk[i]);
			}
			sumC = CnUtils.ge_add(sumC, CnUtils.ge_scalarmult(CnVars.H, CnUtils.d2s(rv.txnFee)));
			let full_message = CnTransactions.get_pre_mlsag_hash(rv);
			rv.p.MGs.push(CnTransactions.proveRctMG(full_message, mixRing[0], inSk[0], kimg[0], sumout, sumC, indices[0]));
		}
		return rv;
	}

	export function construct_tx(
		keys : {
			view: {
				pub: string,
				sec: string
			},
			spend: {
				pub: string,
				sec: string
			}
		},
		sources : CnTransactions.Source[],
		dsts : CnTransactions.Destination[],
		fee_amount : any/*JSBigInt*/,
		payment_id : string,
		pid_encrypt : boolean,
		realDestViewKey : string|undefined,
		unlock_time : number = 0,
		rct:boolean
	){
		//we move payment ID stuff here, because we need txkey to encrypt
		let txkey = Cn.random_keypair();
		console.log(txkey);
		let extra = '';
		if (payment_id) {
			if (pid_encrypt && payment_id.length !== INTEGRATED_ID_SIZE * 2) {
				throw "payment ID must be " + INTEGRATED_ID_SIZE + " bytes to be encrypted!";
			}
			console.log("Adding payment id: " + payment_id);
			if (pid_encrypt && realDestViewKey) { //get the derivation from our passed viewkey, then hash that + tail to get encryption key
				let pid_key = CnUtils.cn_fast_hash(Cn.generate_key_derivation(realDestViewKey, txkey.sec) + ENCRYPTED_PAYMENT_ID_TAIL.toString(16)).slice(0, INTEGRATED_ID_SIZE * 2);
				console.log("Txkeys:", txkey, "Payment ID key:", pid_key);
				payment_id = CnUtils.hex_xor(payment_id, pid_key);
			}
			let nonce = CnTransactions.get_payment_id_nonce(payment_id, pid_encrypt);
			console.log("Extra nonce: " + nonce);
			extra = CnTransactions.add_nonce_to_extra(extra, nonce);
		}
		let tx : CnTransactions.Transaction = {
			unlock_time: unlock_time,
			version: rct ? CURRENT_TX_VERSION : OLD_TX_VERSION,
			extra: extra,
			prvkey: '',
			vin: [],
			vout: [],
			rct_signatures:{
				ecdhInfo:[],
				outPk:[],
				pseudoOuts:[],
				txnFee:'',
				type:0,
			},
			signatures:[]
		};
		tx.prvkey = txkey.sec;

		let in_contexts = [];
		let inputs_money = JSBigInt.ZERO;
		let i, j;

		console.log('Sources: ');
		//run the for loop twice to sort ins by key image
		//first generate key image and other construction data to sort it all in one go
		for (i = 0; i < sources.length; i++) {
			console.log(i + ': ' + Cn.formatMoneyFull(sources[i].amount));
			if (sources[i].real_out >= sources[i].outputs.length) {
				throw "real index >= outputs.length";
			}
			// inputs_money = inputs_money.add(sources[i].amount);

			// sets res.mask among other things. mask is identity for non-rct transactions
			// and for coinbase ringct (type = 0) txs.
			let res = CnTransactions.generate_key_image_helper_rct(keys, sources[i].real_out_tx_key, sources[i].real_out_in_tx, ''+sources[i].mask); //mask will be undefined for non-rct
			// in_contexts.push(res.in_ephemeral);

			// now we mark if this is ringct coinbase txs. such transactions
			// will have identity mask. Non-ringct txs will have  sources[i].mask set to null.
			// this only works if beckend will produce masks in get_unspent_outs for
			// coinbaser ringct txs.
			//is_rct_coinbases.push((sources[i].mask ? sources[i].mask === I : 0));

			console.log('res.in_ephemeral.pub', res, res.in_ephemeral.pub, sources, i);
			if (res.in_ephemeral.pub !== sources[i].outputs[sources[i].real_out].key) {
				throw "in_ephemeral.pub != source.real_out.key";
			}
			sources[i].key_image = res.image;
			sources[i].in_ephemeral = res.in_ephemeral;
		}
		//sort ins
		sources.sort(function(a,b){
			return JSBigInt.parse(a.key_image, 16).compare(JSBigInt.parse(b.key_image, 16)) * -1 ;
		});
		//copy the sorted sources data to tx
		for (i = 0; i < sources.length; i++) {
			inputs_money = inputs_money.add(sources[i].amount);
			in_contexts.push(sources[i].in_ephemeral);
			let input_to_key : CnTransactions.Vin = {
				type:"input_to_key",
				amount:sources[i].amount,
				k_image:sources[i].key_image,
				key_offsets:[],
			};
			for (j = 0; j < sources[i].outputs.length; ++j) {
				console.log('add to key offsets',sources[i].outputs[j].index, j, sources[i].outputs);
				input_to_key.key_offsets.push(sources[i].outputs[j].index);
			}
			console.log('key offsets before abs',input_to_key.key_offsets);
			input_to_key.key_offsets = CnTransactions.abs_to_rel_offsets(input_to_key.key_offsets);
			console.log('key offsets after abs',input_to_key.key_offsets);
			tx.vin.push(input_to_key);
		}
		let outputs_money = JSBigInt.ZERO;
		let out_index = 0;
		let amountKeys = []; //rct only
		for (i = 0; i < dsts.length; ++i) {
			if (new JSBigInt(dsts[i].amount).compare(0) < 0) {
				throw "dst.amount < 0"; //amount can be zero if no change
			}
			let destKeys = Cn.decode_address(dsts[i].address);

			// R = rD for subaddresses
			if(Cn.is_subaddress(dsts[i].address)) {
				txkey.pub = CnUtils.ge_scalarmult(destKeys.spend, txkey.sec);
			}
			let out_derivation;
			// send change to ourselves
			if(destKeys.view === keys.view.pub) {
				out_derivation = Cn.generate_key_derivation(txkey.pub, keys.view.sec);
			}
			else {
				out_derivation = Cn.generate_key_derivation(destKeys.view, txkey.sec);
			}

			if (rct) {
				amountKeys.push(CnUtils.derivation_to_scalar(out_derivation, out_index));
			}
			let out_ephemeral_pub = Cn.derive_public_key(out_derivation, out_index, destKeys.spend);
			let out : CnTransactions.Vout = {
				amount: dsts[i].amount.toString(),
				target:{
					type: "txout_to_key",
					key: out_ephemeral_pub
				}
			};
			// txout_to_key
			tx.vout.push(out);
			++out_index;
			outputs_money = outputs_money.add(dsts[i].amount);
		}

		// add pub key to extra after we know whether to use R = rG or R = rD
		tx.extra = CnTransactions.add_pub_key_to_extra(tx.extra, txkey.pub);

		if (outputs_money.add(fee_amount).compare(inputs_money) > 0) {
			throw "outputs money (" + Cn.formatMoneyFull(outputs_money) + ") + fee (" + Cn.formatMoneyFull(fee_amount) + ") > inputs money (" + Cn.formatMoneyFull(inputs_money) + ")";
		}
		if (!rct) {
			for (i = 0; i < sources.length; ++i) {
				let src_keys : string[] = [];
				for (j = 0; j < sources[i].outputs.length; ++j) {
					src_keys.push(sources[i].outputs[j].key);
				}
				let sigs = CnNativeBride.generate_ring_signature(CnTransactions.get_tx_prefix_hash(tx), tx.vin[i].k_image, src_keys,
					in_contexts[i].sec, sources[i].real_out);
				tx.signatures.push(sigs);
			}
		} else { //rct
			let txnFee = fee_amount;
			let keyimages = [];
			let inSk = [];
			let inAmounts = [];
			let mixRing : {dest:string, mask:string}[][] = [];
			let indices = [];
			for (i = 0; i < tx.vin.length; i++) {
				keyimages.push(tx.vin[i].k_image);
				inSk.push({
					x: in_contexts[i].sec,
					a: in_contexts[i].mask,
				});
				inAmounts.push(tx.vin[i].amount);
				if (in_contexts[i].mask !== CnVars.I) {
					//if input is rct (has a valid mask), 0 out amount
					tx.vin[i].amount = "0";
				}
				mixRing[i] = [];
				for (j = 0; j < sources[i].outputs.length; j++) {
					mixRing[i].push({
						dest: sources[i].outputs[j].key,
						mask: sources[i].outputs[j].commit,
					});
				}
				indices.push(sources[i].real_out);
			}
			let outAmounts = [];
			for (i = 0; i < tx.vout.length; i++) {
				outAmounts.push(tx.vout[i].amount);
				tx.vout[i].amount = "0"; //zero out all rct outputs
			}
			console.log('rc signature----');
			let tx_prefix_hash = CnTransactions.get_tx_prefix_hash(tx);
			console.log('rc signature----');
			tx.rct_signatures = CnTransactions.genRct(tx_prefix_hash, inSk, keyimages, /*destinations, */inAmounts, outAmounts, mixRing, amountKeys, indices, txnFee);

		}
		console.log(tx);
		return tx;
	}

	export function create_transaction(pub_keys:{spend:string,view:string},
									   sec_keys:{spend:string,view:string},
									   dsts : CnTransactions.Destination[],
									   outputs : {
										   amount:number,
										   public_key:string,
										   index:number,
										   global_index:number,
										   rct:string,
										   tx_pub_key:string,
									   }[],
									   mix_outs:{
										   outputs:{
											   rct: string,
											   public_key:string,
											   global_index:number
										   }[],
										   amount:0
									   }[] = [],
									   fake_outputs_count:number,
									   fee_amount : any/*JSBigInt*/,
									   payment_id : string,
									   pid_encrypt : boolean,
									   realDestViewKey : string|undefined,
									   unlock_time : number = 0,
									   rct:boolean
	) : CnTransactions.Transaction{
		let i, j;
		if (dsts.length === 0) {
			throw 'Destinations empty';
		}
		if (mix_outs.length !== outputs.length && fake_outputs_count !== 0) {
			throw 'Wrong number of mix outs provided (' + outputs.length + ' outputs, ' + mix_outs.length + ' mix outs)';
		}
		for (i = 0; i < mix_outs.length; i++) {
			if ((mix_outs[i].outputs || []).length < fake_outputs_count) {
				throw 'Not enough outputs to mix with';
			}
		}
		let keys = {
			view: {
				pub: pub_keys.view,
				sec: sec_keys.view
			},
			spend: {
				pub: pub_keys.spend,
				sec: sec_keys.spend
			}
		};
		if (!Cn.valid_keys(keys.view.pub, keys.view.sec, keys.spend.pub, keys.spend.sec)) {
			throw "Invalid secret keys!";
		}
		let needed_money = JSBigInt.ZERO;
		for (i = 0; i < dsts.length; ++i) {
			needed_money = needed_money.add(dsts[i].amount);
			if (needed_money.compare(UINT64_MAX) !== -1) {
				throw "Output overflow!";
			}
		}
		let found_money = JSBigInt.ZERO;
		let sources : CnTransactions.Source[] = [];
		console.log('Selected transfers: ', outputs);
		for (i = 0; i < outputs.length; ++i) {
			found_money = found_money.add(outputs[i].amount);
			if (found_money.compare(UINT64_MAX) !== -1) {
				throw "Input overflow!";
			}
			let src : CnTransactions.Source = {
				outputs: [],
				amount: '',
				real_out_tx_key:'',
				real_out:0,
				real_out_in_tx:0,
				mask:null,
				key_image:'',
				in_ephemeral:{
					pub: '',
					sec: '',
					mask: ''
				}
			};
			src.amount = new JSBigInt(outputs[i].amount).toString();
			if (mix_outs.length !== 0) {
				// Sort fake outputs by global index
				console.log('mix outs before sort',mix_outs[i].outputs);
				mix_outs[i].outputs.sort(function(a, b) {
					return new JSBigInt(a.global_index).compare(b.global_index);
				});
				j = 0;

				console.log('mix outs sorted',mix_outs[i].outputs);

				while ((src.outputs.length < fake_outputs_count) && (j < mix_outs[i].outputs.length)) {
					let out = mix_outs[i].outputs[j];
					console.log('chekcing mixin',out, outputs[i]);
					if (out.global_index === outputs[i].global_index) {
						console.log('got mixin the same as output, skipping');
						j++;
						continue;
					}
					let oe : Output = {
						index:out.global_index.toString(),
						key:out.public_key,
						commit:''
					};
					if (rct){
						if (out.rct){
							oe.commit = out.rct.slice(0,64); //add commitment from rct mix outs
						} else {
							if (outputs[i].rct) {throw "mix rct outs missing commit";}
							oe.commit = zeroCommit(CnUtils.d2s(src.amount)); //create identity-masked commitment for non-rct mix input
						}
					}
					src.outputs.push(oe);
					j++;
				}
			}
			let real_oe = {
				index:new JSBigInt(outputs[i].global_index || 0).toString(),
				key:outputs[i].public_key,
				commit:'',
			};
			console.log('OUT FOR REAL:',outputs[i].global_index);
			if (rct){
				if (outputs[i].rct) {
					real_oe.commit = outputs[i].rct.slice(0,64); //add commitment for real input
				} else {
					console.log('ZERO COMMIT');
					real_oe.commit = zeroCommit(CnUtils.d2s(src.amount)); //create identity-masked commitment for non-rct input
				}
			}
			let real_index = src.outputs.length;
			for (j = 0; j < src.outputs.length; j++) {
				if (new JSBigInt(real_oe.index).compare(src.outputs[j].index) < 0) {
					real_index = j;
					break;
				}
			}
			// Add real_oe to outputs
			console.log('inserting real ouput at index', real_index, real_oe, outputs[i], i);
			src.outputs.splice(real_index, 0, real_oe);
			src.real_out_tx_key = outputs[i].tx_pub_key;
			// Real output entry index
			src.real_out = real_index;
			src.real_out_in_tx = outputs[i].index;
			console.log('check mask', outputs, rct, i);
			if (rct){
				if (outputs[i].rct) {
					src.mask = outputs[i].rct.slice(64,128); //encrypted or idenity mask for coinbase txs.
				} else {
					console.log('NULL MASK');
					src.mask = null; //will be set by generate_key_image_helper_rct
				}
			}
			sources.push(src);
		}
		console.log('sources: ', sources);
		let change = {
			amount: JSBigInt.ZERO
		};
		let cmp = needed_money.compare(found_money);
		if (cmp < 0) {
			change.amount = found_money.subtract(needed_money);
			if (change.amount.compare(fee_amount) !== 0) {
				throw "early fee calculation != later";
			}
		} else if (cmp > 0) {
			throw "Need more money than found! (have: " + Cn.formatMoney(found_money) + " need: " + Cn.formatMoney(needed_money) + ")";
		}
		return CnTransactions.construct_tx(keys, sources, dsts, fee_amount, payment_id, pid_encrypt, realDestViewKey, unlock_time, rct);
	}
}