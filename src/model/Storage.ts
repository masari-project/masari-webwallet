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

interface StorageInterface {
	setItem(key: string, value: string): Promise<void>;
	getItem(key: string, defaultValue: any): Promise<any>;

	keys(): Promise<string[]>;
	remove(key: string): Promise<void>;
	clear(): Promise<void>;
}

class LocalStorage implements StorageInterface{
	setItem(key: string, value: string): Promise<void> {
		window.localStorage.setItem(key, value);
		return Promise.resolve();
	}

	getItem(key: string, defaultValue: any = null): Promise<string|any> {
		let value = window.localStorage.getItem(key);
		if (value === null)
			return Promise.resolve(defaultValue);
		return Promise.resolve(value);
	}

	keys(): Promise<string[]> {
		let keys: string[] = [];
		for (let i = 0; i < window.localStorage.length; ++i) {
			let k = window.localStorage.key(i);
			if (k !== null)
				keys.push(k);
		}

		return Promise.resolve(keys);
	}

	remove(key: string): Promise<void> {
		window.localStorage.removeItem(key);
		return Promise.resolve();
	}

	clear(): Promise<void> {
		window.localStorage.clear();
		return Promise.resolve();
	}
}


class NativeStorageWrap implements StorageInterface{
	setItem(key: string, value: any): Promise<void> {
		return new Promise<void>(function (resolve, reject) {
			if(window.NativeStorage)
				window.NativeStorage.setItem(key,value,function(){
					resolve();
				}, function(error : NativeNativeStorageError){
					reject();
				});
			else
				reject();
		});
	}

	getItem(key: string, defaultValue: any = null): Promise<any> {
		return new Promise<any>(function (resolve, reject) {
			if(window.NativeStorage)
				window.NativeStorage.getItem(key,function(){
					resolve();
				}, function(error : NativeNativeStorageError){
					if(error.code === 2)
						resolve(defaultValue);
					reject();
				});
			else
				reject();
		});
	}

	keys(): Promise<string[]> {
		return new Promise<string[]>(function (resolve, reject) {
			if(window.NativeStorage)
				window.NativeStorage.keys(function(keys : string[]){
					resolve(keys);
				}, function(error : NativeNativeStorageError){
					reject();
				});
			else
				reject();
		});
	}

	remove(key: string): Promise<void> {
		return new Promise<void>(function (resolve, reject) {
			if(window.NativeStorage)
				window.NativeStorage.remove(key,function(){
					resolve();
				}, function(error : NativeNativeStorageError){
					if(error.code === 2 || error.code === 3 || error.code === 4)
						resolve();
					reject();
				});
			else
				reject();
		});
	}

	clear(): Promise<void> {
		return new Promise<void>(function (resolve, reject) {
			if(window.NativeStorage)
				window.NativeStorage.clear(function(){
					resolve();
				}, function(error : NativeNativeStorageError){
					reject();
				});
			else
				reject();
		});
	}
}


export class Storage{
	static _storage : StorageInterface = new LocalStorage();

	static clear(): Promise<void> {
		return Storage._storage.clear();
	}

	static getItem(key: string, defaultValue: any = null): Promise<any> {
		return Storage._storage.getItem(key,defaultValue);
	}

	static keys(): Promise<string[]> {
		return Storage._storage.keys();
	}

	static remove(key: string): Promise<void> {
		return Storage._storage.remove(key);
	}

	static removeItem(key: string): Promise<void> {
		return Storage._storage.remove(key);
	}

	static setItem(key: string, value: any): Promise<void> {
		return Storage._storage.setItem(key,value);
	}

}

if(window.NativeStorage){
	Storage._storage = new NativeStorageWrap();
}