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

export class CoinUri{

	static coinPrefix = 'masari:';
	static coinAddressLength = 95;

	static decode(str : string){
		if(str.indexOf(CoinUri.coinPrefix) === 0){
			let data = str.replace(this.coinPrefix,'').trim();
			let exploded = data.split('?');

			if(exploded.length == 0)
				throw 'missing_address';

			if(exploded[0].length !== this.coinAddressLength)
				throw 'invalid_address_length';

			let decodedUri : any = {
				address:exploded[0]
			};

			for(let i = 1; i < exploded.length; ++i){
				let optionParts = exploded[i].split('=');
				if(optionParts.length === 2){
					switch (optionParts[0].trim()){
						case 'tx_payment_id':
							decodedUri.paymentId=optionParts[1];
							break;
						case 'recipient_name':
							decodedUri.recipientName=optionParts[1];
							break;
						case 'tx_amount':
							decodedUri.amount=optionParts[1];
							break;
						case 'tx_description':
							decodedUri.description=optionParts[1];
							break;
					}
				}
			}

		}
	}

	static isValid(str : string){
		try{
			this.decode(str);
			return true;
		}catch (e) {
			return false;
		}
	}

	static encode(address : string, paymentId:string|null = null, amount : string|null=null, recipientName:string|null = null, description : string|null=null){
		let encoded = this.coinPrefix + address;
		if(address.length !== this.coinAddressLength)
			throw 'invalid_address_length';

		if(paymentId !== null) encoded += '?tx_payment_id='+paymentId;
		if(amount !== null) encoded+= '?tx_amount='+amount;
		if(recipientName !== null) encoded += '?recipient_name='+recipientName;
		if(description !== null) encoded += '?tx_description='+description;
		return encoded;
	}



}