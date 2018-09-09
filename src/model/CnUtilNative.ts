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

let generate_key_derivation_bind : any = null;
let derive_public_key_bind : any = null;

export class CnUtilNative{
	static generate_key_derivation : (pub : any, sec : any) => string;
	static derive_public_key : (derivation : string,output_idx_in_tx : number,pubSpend : string) => string;

	static hextobin(hex : any) {
		if (hex.length % 2 !== 0) throw "Hex string has invalid length!";
		let res = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length / 2; ++i) {
			res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
		return res;
	}

	static bintohex(bin : any) {
		let out = [];
		for (let i = 0; i < bin.length; ++i) {
			out.push(("0" + bin[i].toString(16)).slice(-2));
		}
		return out.join("");
	}

	static generate_key_derivation_native(pub : any, sec : any){

		let pub_b = CnUtilNative.hextobin(pub);
		let sec_b = CnUtilNative.hextobin(sec);
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

		return CnUtilNative.bintohex(res);
	}

	static derive_public_key_native(derivation : string,
							 output_idx_in_tx : number,
							 pubSpend : string){

		let derivation_b = CnUtilNative.hextobin(derivation);
		let pub_spend_b = CnUtilNative.hextobin(pubSpend);


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

		return CnUtilNative.bintohex(res);
	}
}

if(typeof (<any>self).Module_native !== 'undefined') {
	generate_key_derivation_bind = (<any>self).Module_native.cwrap('generate_key_derivation', null, ['number', 'number', 'number']);
	derive_public_key_bind = (<any>self).Module_native.cwrap('derive_public_key', null, ['number', 'number', 'number', 'number']);
	CnUtilNative.generate_key_derivation = CnUtilNative.generate_key_derivation_native;
	CnUtilNative.derive_public_key = CnUtilNative.derive_public_key_native;
}else{
	CnUtilNative.generate_key_derivation = function(pub : any, sec : any){return cnUtil.generate_key_derivation(pub, sec)};
	CnUtilNative.derive_public_key = function(derivation : string,output_idx_in_tx : number,pubSpend : string){return cnUtil.derive_public_key(derivation, output_idx_in_tx, pubSpend)}
}