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

import {Storage} from "./Storage";

export class Translations{

	static getBrowserLang() : string{
		let browserUserLang = ''+(navigator.language || (<any>navigator).userLanguage);
		browserUserLang = browserUserLang.toLowerCase().split('-')[0];
		return browserUserLang;
	}

	static getLang() : Promise<string>{
		return Storage.getItem('user-lang', Translations.getBrowserLang());
	}

	static setBrowserLang(lang : string){
		Storage.setItem('user-lang', lang);
	}

	static storedTranslations : any = {};

	static loadLangTranslation(lang : string) : Promise<void>{
		console.log('setting lang to '+lang);
		let promise : Promise<{messages?: any, date?: string, number?: string }>;
		if(typeof Translations.storedTranslations[lang] !== 'undefined')
			promise = Promise.resolve(Translations.storedTranslations[lang]);
		else
			promise = new Promise<{messages?: any, date?: string, number?: string }>(function (resolve, reject) {
				$.ajax({
					url: './translations/' + lang + '.json'
				}).then(function (data: any) {
					if(typeof data === 'string')data = JSON.parse(data);
					Translations.storedTranslations[lang] = data;
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

}