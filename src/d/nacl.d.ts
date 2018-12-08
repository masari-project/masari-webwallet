declare var nacl : {
	ll:{
		ge_scalarmult:(a : Uint8Array, b : Uint8Array)=>Uint8Array,
		ge_double_scalarmult_base_vartime:(a : Uint8Array, b : Uint8Array, c : Uint8Array)=>Uint8Array,
		ge_double_scalarmult_postcomp_vartime:(a : Uint8Array, b : Uint8Array, c : Uint8Array, d : Uint8Array)=>Uint8Array,
		ge_add:(a : Uint8Array, b : Uint8Array)=>Uint8Array,
		ge_scalarmult_base:(a : Uint8Array)=>Uint8Array
	},
	secretbox:any,
	//open:(encrypted:Uint8Array, nonce:Uint8Array, privKey:Uint8Array)=>Uint8Array;
	util:{
		encodeBase64:(value : Uint8Array)=>string,
	},
	randomBytes:(bits : number) => Uint8Array
};

declare function keccak_256(bin : Uint8Array) : string;