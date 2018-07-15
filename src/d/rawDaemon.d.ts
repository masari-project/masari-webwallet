type EcdhInfo = {
	mask: string,
	amount: string
}

type RctSignature = {
	ecdhInfo:EcdhInfo[]
	outPk:string[],
	psuedoOuts:string[],
	txnFee:number,
	type:number
}

type Vin = {
	key:{
		amount:number,
		k_image:string,
		key_offsets:number[]
	}
}

type Vout = {
	amount: 0,
	target:{
		key:string
	}
}

type RawDaemonTransaction = {

	extra : number[],

	vout : Vout[],
	vin : Vin[],

	rct_signatures:RctSignature,
	unlock_time:number,
	version:number,
	ctsig_prunable:any,
	global_index_start?:number,
	height?:number,
	ts?:number
	hash?:string
};

type RawDaemonBlock = any;