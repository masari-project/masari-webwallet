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

import {Router} from "./lib/numbersLab/Router";
import {Mnemonic} from "./model/Mnemonic";
import {DestructableView} from "./lib/numbersLab/DestructableView";
import {VueClass, VueVar, VueWatched} from "./lib/numbersLab/VueAnnotate";

//========================================================
//bridge for cnUtil with the new mnemonic class
//========================================================
(<any>window).mn_random = Mnemonic.mn_random;
(<any>window).mn_encode = Mnemonic.mn_encode;
(<any>window).mn_decode = Mnemonic.mn_decode;

//========================================================
//====================Translation code====================
//========================================================
const i18n = new VueI18n({
	locale: 'en',
	fallbackLocale: 'en',
});
(<any>window).i18n = i18n;

let browserUserLang = ''+(navigator.language || (<any>navigator).userLanguage);
browserUserLang = browserUserLang.toLowerCase().split('-')[0];

let userLang = browserUserLang;
let storedUserLang = window.localStorage.getItem('user-lang');
if(storedUserLang !== null){
	userLang = storedUserLang;
}

let storedTranslations : any = {};

function loadLangTranslation(lang : string) : Promise<void>{
	console.log('setting lang to '+lang);
	let promise : Promise<{messages?: any, date?: string, number?: string }>;
	if(typeof storedTranslations[lang] !== 'undefined')
		promise = Promise.resolve(storedTranslations[lang]);
	else
		promise = new Promise<{messages?: any, date?: string, number?: string }>(function (resolve, reject) {
			$.ajax({
				url: './translations/' + lang + '.json'
			}).then(function (data: any) {
				if(typeof data === 'string')data = JSON.parse(data);
				storedTranslations[lang] = data;
				resolve(data);
			}).fail(function () {
				reject();
			});
		});

	promise.then(function(data: { website?:any,messages?: any, date?: string, number?: string }){
		if (typeof data.date !== 'undefined')
			i18n.setDateTimeFormat(lang, data.date);
		if (typeof data.number !== 'undefined')
			i18n.setNumberFormat(lang, data.number);
		if (typeof data.messages !== 'undefined')
			i18n.setLocaleMessage(lang, data.messages);

		i18n.locale = lang;

		$('title').html(data.website.title);
		$('meta[property="og:title"]').attr('content',data.website.title);
		$('meta[property="twitter:title"]').attr('content',data.website.title);

		$('meta[name="description"]').attr('content',data.website.description);
		$('meta[property="og:description"]').attr('content',data.website.description);
		$('meta[property="twitter:description"]').attr('content',data.website.description);


		let htmlDocument = document.querySelector('html');
		if (htmlDocument !== null)
			htmlDocument.setAttribute('lang', lang);
	});

	return (<any>promise);
}

loadLangTranslation(userLang).catch(function () {
	loadLangTranslation('en');
});

//========================================================
//====================Generic design======================
//========================================================

@VueClass()
class MenuView extends Vue{
	isMenuHidden : boolean = false;

	constructor(containerName:any,vueData:any=null){
		super(vueData);
		this.isMenuHidden = $('body').hasClass('menuHidden');
	}

	toggle(){
		this.isMenuHidden = !this.isMenuHidden;
		if(this.isMenuHidden)
			$('body').addClass('menuHidden');
		else
			$('body').removeClass('menuHidden');
	}
}
let menuView = new MenuView('#menu');

$('#menu a').on('click',function(event:Event){
	menuView.toggle();
});
$('#menu').on('click',function(event:Event){
	event.stopPropagation();
});

$('#topBar .toggleMenu').on('click',function(event:Event){
	menuView.toggle();
	event.stopPropagation();
	return false;
});

$(window).click(function() {
	menuView.isMenuHidden = true;
	$('body').addClass('menuHidden');
});

@VueClass()
class CopyrightView extends Vue{

	@VueVar(userLang) language !: string;

	constructor(containerName:any,vueData:any=null){
		super(vueData);
	}

	@VueWatched()
	languageWatch(){
		window.localStorage.setItem('user-lang', this.language);
		loadLangTranslation(this.language);
	}
}
let copyrightView = new CopyrightView('#copyright');

//========================================================
//==================Loading the right page================
//========================================================

let isCordovaApp = document.URL.indexOf('http://') === -1
	&& document.URL.indexOf('https://') === -1;

let promiseLoadingReady : Promise<void>;

window.native = false;
if(isCordovaApp){
	window.native = true;
	$('body').addClass('native');

	let promiseLoadingReadyResolve : null|Function = null;
	let promiseLoadingReadyReject : null|Function = null;
	promiseLoadingReady = new Promise<void>(function(resolve, reject){
		promiseLoadingReadyResolve = resolve;
		promiseLoadingReadyReject = reject;
	});
	let cordovaJs = document.createElement('script');
	cordovaJs.type = 'text/javascript';
	cordovaJs.src = 'cordova.js';
	document.body.appendChild(cordovaJs);

	let timeoutCordovaLoad = setTimeout(function(){
		if(promiseLoadingReadyResolve)
			promiseLoadingReadyResolve();
	}, 10*1000);
	document.addEventListener('deviceready', function(){
		if(promiseLoadingReadyResolve)
			promiseLoadingReadyResolve();
		clearInterval(timeoutCordovaLoad);
	}, false);

}else
	promiseLoadingReady = Promise.resolve();

promiseLoadingReady.then(function(){
	let router = new Router('./','../../');
	window.onhashchange = function () {
		router.changePageFromHash();
	};
});

//========================================================
//==================Service worker for web================
//========================================================
//only install the service on web platforms and not native
if (!isCordovaApp && 'serviceWorker' in navigator) {
	const showRefreshUI = function(registration : any){
		console.log(registration);
		swal({
			type:'info',
			title:i18n.t('global.newVersionModal.title'),
			html:i18n.t('global.newVersionModal.content'),
			confirmButtonText:i18n.t('global.newVersionModal.confirmText'),
			showCancelButton: true,
			cancelButtonText:i18n.t('global.newVersionModal.cancelText'),
		}).then(function(value : any){
			if(!value.dismiss){
				registration.waiting.postMessage('force-activate');
			}
		});
	};

	const onNewServiceWorker = function(registration:any, callback : Function){
		if (registration.waiting) {
			// SW is waiting to activate. Can occur if multiple clients open and
			// one of the clients is refreshed.
			return callback();
		}

		const listenInstalledStateChange = () => {
			registration.installing.addEventListener('statechange', (event : Event) => {
				if ((<any>event.target).state === 'installed') {
					// A new service worker is available, inform the user
					callback();
				}
			});
		};

		if (registration.installing) {
			return listenInstalledStateChange();
		}

		// We are currently controlled so a new SW may be found...
		// Add a listener in case a new SW is found,
		registration.addEventListener('updatefound', listenInstalledStateChange);
	};

	navigator.serviceWorker.addEventListener('message', (event) => {
		if (!event.data) {
			return;
		}

		switch (event.data) {
			case 'reload-window-update':
				window.location.reload(true);
				break;
			default:
				// NOOP
				break;
		}
	});

	navigator.serviceWorker.register('/service-worker.js').then(function (registration) {
		// Track updates to the Service Worker.
		if (!navigator.serviceWorker.controller) {
			// The window client isn't currently controlled so it's a new service
			// worker that will activate immediately
			return;
		}

		console.log('on new service worker');
		onNewServiceWorker(registration, () => {
			showRefreshUI(registration);
		});
	});
}