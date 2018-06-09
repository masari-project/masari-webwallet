interface CnUtilClass{
	generate_key_derivation(tx_pub_key:string, priv_view_key:string) : string;

	decode_rct_ecdh(ecdh : string, key : string) : {
		mask: string,
		amount: string
	};

	derivation_to_scalar(derivation : string, output_index : number) : string;

	derive_public_key(derivation  : string, out_index : number, pub : string) : string;

	derive_secret_key(derivation  : string, out_index : number, sec : string) : string;

	generate_key_image_2(pub : string, sec : string) : string;
	pubkeys_to_string(spend : string, view : string) : string;
	sec_key_to_pub(sec : string) : string;
	encode_varint(i : number) : string;
	cn_fast_hash(input : string) : string;

	decode_address(address : string) : {spend:string, view:string, intPaymentId?:string};

	zeroCommit(string : string) : string;
	d2s(str : number) : string;

	estimateRctSize(inputs:number, mixin:number, outputs:number) : number;
	formatMoney(amount : number) : string;
	formatMoneySymbol(amount : number) : string;
	formatMoneyFull(amount : number) : string;
	formatMoneyFullSymbol(amount : number) : string;

	create_address(seed : string) : {
		spend:{
			sec:string,
			pub:string
		},
		view:{
			sec:string,
			pub:string
		},
		public_addr:string
	};
	random_scalar() : string;
	printDsts(data : any) : void;

	decompose_tx_destinations(dest : {address:string,amount:number}[], rct : boolean) : {address:string,amount:number}[];

	create_transaction(
		pub_keys:{spend:string,view:string},
		sec_keys:{spend:string,view:string},
		dsts : {address:string,amount:number}[],
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
		}[],
		fake_outputs_count:number,
		fee_amount : any/*JSBigInt*/,
		payment_id : string,
		pid_encrypt : boolean,
		realDestViewKey : string|undefined,
		unlock_time : number,
		rct:boolean
		) : {
			extra:string,
			prvkey:string,
			rct_signatures:{
				type:number,
				message:string,
				outPk:any,
				p:any,
				ecdhInfo:any
			},
			unlock_time:number,
			version:number,
			vin:any,
			vout:any,
	};

	serialize_rct_tx_with_hash(signed : any) : {
		hash:string,
		prvKey:string,
		raw:string
	}

	random_keypair() : {sec:any,pub:any}

	sc_reduce32(seed : string) : string;
	generate_keys(seed : string) : {sec:string,pub:string};
	rand_32() : string;

	decrypt_payment_id(payment_id8 : string, tx_public_key : string, acc_prv_view_key : string) : string;

	get_account_integrated_address(address : string, paymentId8 : string) : string;

}

declare var cnUtil : CnUtilClass;