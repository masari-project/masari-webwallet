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

import {CnUtilNative} from "./CnUtilNative";

export class CryptoUtils{


	static bintohex(bin : any) {
		let out = [];
		for (let i = 0; i < bin.length; ++i) {
			out.push(("0" + bin[i].charCodeAt(0).toString(16)).slice(-2));
		}
		return out.join("");
	}

//addKeys2
//aGbB = aG + bB where a, b are scalars, G is the basepoint and B is a point
	static addKeys2(aGbB : any, a : any, b : any, B : any) {
		// ge_p2 rv;
		// ge_p3 B2;
		// CHECK_AND_ASSERT_THROW_MES_L1(ge_frombytes_vartime(&B2, B.bytes) == 0, "ge_frombytes_vartime failed at "+boost::lexical_cast<std::string>(__LINE__));
		// ge_double_scalarmult_base_vartime(&rv, b.bytes, &B2, a.bytes);
		// ge_tobytes(aGbB.bytes, &rv);
	}

	static hextobin(hex:string) {
		if (hex.length % 2 !== 0) throw "Hex string has invalid length!";
		let res = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length / 2; ++i) {
			res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
			// console.log(hex.slice(i * 2, i * 2 + 2), res[i]);
		}
		return res;
	}

	static swapEndian(hex:any){
		if (hex.length % 2 !== 0){return "length must be a multiple of 2!";}
		let data = "";
		for (let i=1; i <= hex.length / 2; i++){
			data += hex.substr(0 - 2 * i, 2);
		}
		return data;
	}

//switch byte order charwise
	static swapEndianC(string:any){
		let data = "";
		for (let i=1; i <= string.length; i++){
			data += string.substr(0 - i, 1);
		}
		return data;
	}

//for most uses you'll also want to swapEndian after conversion
//mainly to convert integer "scalars" to usable hexadecimal strings
	static d2h(integer:any){
		if (typeof integer !== "string" && integer.toString().length > 15){throw "integer should be entered as a string for precision";}
		let padding = "";
		for (let i = 0; i < 63; i++){
			padding += "0";
		}
		return (padding + JSBigInt(integer).toString(16).toLowerCase()).slice(-64);
	}

// hexadecimal to integer
	static h2d(test : any) {
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
			vali = (vali * 256 + parseInt(test.slice(j*2, j*2+2), 16));
		}
		return vali;
	}

	static decodeRctSimple(rv : any, sk  :any, i : number, mask : any, hwdev : any=null) {
		// CHECK_AND_ASSERT_MES(rv.type == RCTTypeSimple || rv.type == RCTTypeSimpleBulletproof, false, "decodeRct called on non simple rctSig");
		// CHECK_AND_ASSERT_THROW_MES(i < rv.ecdhInfo.size(), "Bad index");
		// CHECK_AND_ASSERT_THROW_MES(rv.outPk.size() == rv.ecdhInfo.size(), "Mismatched sizes of rv.outPk and rv.ecdhInfo");
// console.log(i < rv.ecdhInfo.length ? undefined : 'Bad index');
// console.log(rv.outPk.length == rv.ecdhInfo.length ? undefined : 'Mismatched sizes of rv.outPk and rv.ecdhInfo');

		//mask amount and mask
		// console.log('decode',rv.ecdhInfo[i], sk, h2d(rv.ecdhInfo[i].amount));
		let ecdh_info = cnUtil.decode_rct_ecdh(rv.ecdhInfo[i], sk);
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

		return CryptoUtils.h2d(amount);
	}


	static RCTTypeFull = 1;
	static RCTTypeSimple = 2;

	static decode_ringct(rv:any,
						   pub : any,
						   sec : any,
						   i : number,
						   mask : any,
						   amount : any,
						   derivation : string|null)
	{
		if(derivation===null)
			derivation = cnUtil.generate_key_derivation(pub, sec);//[10;11]ms

		let scalar1 = cnUtil.derivation_to_scalar(derivation, i);//[0.2ms;1ms]

		try
		{
			// console.log(rv.type,'RCTTypeSimple='+RCTTypeSimple,'RCTTypeFull='+RCTTypeFull);
			switch (rv.type)
			{
				case CryptoUtils.RCTTypeSimple:
					// console.log('RCTTypeSimple');
					let realAmount = amount;
					// for(let i = 0; i < 1000; ++i)
					amount = CryptoUtils.decodeRctSimple(rv,
						scalar1,
						i,
						mask);//[5;10]ms


					break;
				case CryptoUtils.RCTTypeFull:
					// console.log('RCTTypeSimple');
					amount = CryptoUtils.decodeRctSimple(rv,
						scalar1,
						i,
						mask);
					break;
				// case RCTTypeFull:
				// 	console.log('RCTTypeFull');
				// 	amount = decodeRct(rv,
				// 	rct::sk2rct(scalar1),
				// i,
				// mask);
				// break;
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

	static relative_output_offsets_to_absolute(offsets : Array<number>){
		let res : Array<number> =  offsets.slice();
		for(let i = 1; i < res.length; i++)
			res[i] += res[i-1];
		return res;
	}

	static get_output_keys(amount:number,absolute_offsets:Array<number>){

	}

//CNutil.generate_key_image alternative ??????
	static generate_key_image_helper(ack:{view_secret_key:any,spend_secret_key:string, public_spend_key:string}, tx_public_key:any, real_output_index:any,recv_derivation:string|null)
	{
		if(recv_derivation === null)
			// recv_derivation = cnUtil.generate_key_derivation(tx_public_key, ack.view_secret_key);
			recv_derivation = CnUtilNative.generate_key_derivation(tx_public_key, ack.view_secret_key);
		// console.log('recv_derivation', recv_derivation);

		// CHECK_AND_ASSERT_MES(r, false, "key image helper: failed to generate_key_derivation(" << tx_public_key << ", " << ack.m_view_secret_key << ")");
		//

		// let start = Date.now();

		// let in_ephemeral_pub = cnUtil.derive_public_key(recv_derivation, real_output_index, ack.public_spend_key);
		let in_ephemeral_pub = CnUtilNative.derive_public_key(recv_derivation, real_output_index, ack.public_spend_key);
		// console.log('in_ephemeral_pub',in_ephemeral_pub);


		// CHECK_AND_ASSERT_MES(r, false, "key image helper: failed to derive_public_key(" << recv_derivation << ", " << real_output_index <<  ", " << ack.m_account_address.m_spend_public_key << ")");
		//
		// let in_ephemeral_sec = cnUtil.derive_secret_key(recv_derivation, real_output_index, ack.spend_secret_key);
		let in_ephemeral_sec = cnUtil.derive_secret_key(recv_derivation, real_output_index, ack.spend_secret_key);
		// console.log('in_ephemeral_sec',in_ephemeral_sec);



		let ki = cnUtil.generate_key_image_2(in_ephemeral_pub, in_ephemeral_sec);

		// let end = Date.now();
		// console.log(end-start);

		return {
			ephemeral_pub:in_ephemeral_pub,
			ephemeral_sec:in_ephemeral_sec,
			key_image:ki
		};
	}


}