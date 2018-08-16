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

import {WalletRepository} from "../model/WalletRepository";
import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {VueRequireFilter, VueVar} from "../lib/numbersLab/VueAnnotate";
import {DestructableView} from "../lib/numbersLab/DestructableView";
import {Wallet} from "../model/Wallet";
import {AppState} from "../model/AppState";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name,'default', false);
if(wallet !== null){
	window.location.href = '#account';
}

class IndexView extends DestructableView{
	@VueVar(false) hasLocalWallet !: boolean;
	@VueVar(false) isWalletLoaded !: boolean;

	constructor(container : string){
		super(container);
		this.isWalletLoaded = DependencyInjectorInstance().getInstance(Wallet.name,'default', false) !== null;
		WalletRepository.hasOneStored().then((status : boolean)=>{
			this.hasLocalWallet = status;
		});
		// this.importWallet();
		AppState.disableLeftMenu();
	}

	destruct(): Promise<void> {
		return super.destruct();
	}

	loadWallet(){
		AppState.askUserOpenWallet();
	}

}

let newIndexView = new IndexView('#app');


/*
function readFile(fileEnty:any){
	console.log(fileEnty);
}

function writeFile(fileEntry, dataObj) {
	// Create a FileWriter object for our FileEntry (log.txt).
	fileEntry.createWriter(function (fileWriter) {

		fileWriter.onwriteend = function() {
			console.log("Successful file write...");
			readFile(fileEntry);
		};

		fileWriter.onerror = function (e) {
			console.log("Failed file write: " + e.toString());
		};

		// If data object is not passed in,
		// create a new Blob instead.
		if (!dataObj) {
			dataObj = new Blob(['some file data'], { type: 'text/plain' });
		}

		fileWriter.write(dataObj);
	});
}

function onErrorCreateFile(error){
	alert('onErrorCreateFile:'+JSON.stringify(error));
}
function onErrorLoadFs(error){
	alert('onErrorLoadFs:'+JSON.stringify(error));
}


window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs : any) {

	console.log('file system open: ' + fs.name);
	fs.root.getFile(cordova.file.documentsDirectory+"newPersistentFile.txt", { create: true, exclusive: false }, function (fileEntry : any) {

		console.log("fileEntry is file?" + fileEntry.isFile.toString());
		// fileEntry.name == 'someFile.txt'
		// fileEntry.fullPath == '/someFile.txt'
		writeFile(fileEntry, null);

	}, onErrorCreateFile);

}, onErrorLoadFs);

*/