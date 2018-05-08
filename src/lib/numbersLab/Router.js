/*
 * Copyright 2018 NumbersLab - https://github.com/NumbersLab
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
define(["require", "exports", "./Logger", "./DestructableView", "./Context"], function (require, exports, Logger_1, DestructableView_1, Context_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Router = /** @class */ (function () {
        function Router(routerBaseHtmlRelativity, routerBaseRelativity) {
            if (routerBaseHtmlRelativity === void 0) { routerBaseHtmlRelativity = './'; }
            if (routerBaseRelativity === void 0) { routerBaseRelativity = '../'; }
            this.currentPage = null;
            this.routerBaseHtmlRelativity = './';
            this.routerBaseJsRelativity = '../';
            var self = this;
            this.routerBaseHtmlRelativity = routerBaseHtmlRelativity;
            this.routerBaseJsRelativity = routerBaseRelativity;
            this.changePage(Router.extractPageFromUrl());
        }
        /**
         * Get the current page from the url or fallback on index
         * @returns {any}
         */
        Router.extractPageFromUrl = function () {
            if (window.location.hash.indexOf('#') != -1) {
                return window.location.hash.substr(1);
            }
            else {
                return 'index';
            }
        };
        /**
         * Change the current page by loading the new content in the same page,
         * Update the browser history
         * @param {string} completeNewPageName
         */
        Router.prototype.changePage = function (completeNewPageName, replaceState) {
            if (replaceState === void 0) { replaceState = false; }
            var self = this;
            Logger_1.Logger.info(this, 'Changing page to {newPage} from {oldPage}', {
                newPage: completeNewPageName,
                oldPage: this.currentPage
            });
            $('#pageLoading').show();
            var newPageName = completeNewPageName;
            if (newPageName.indexOf('?') != -1) {
                newPageName = newPageName.substr(0, newPageName.indexOf('?'));
            }
            var currentView = DestructableView_1.DestructableView.getCurrentAppView();
            var promiseDestruct;
            if (currentView !== null) {
                promiseDestruct = currentView.destruct();
            }
            else {
                promiseDestruct = Promise.resolve();
            }
            //we wait the promise of destruction in case of something that could take time
            promiseDestruct.then(function () {
                self.currentPage = completeNewPageName;
                Logger_1.Logger.debug(self, 'Changing to page ' + self.currentPage);
                var promiseContent = self.loadContent(self.routerBaseHtmlRelativity + 'pages/' + newPageName + '.html');
                var jsContentPath = self.routerBaseJsRelativity + 'pages/' + newPageName + '.js';
                Promise.all([promiseContent]).then(function (data) {
                    if (!replaceState) {
                        history.pushState(null, '', '#' + completeNewPageName);
                    }
                    else {
                        history.replaceState(null, '', '#' + completeNewPageName);
                    }
                    var content = data[0];
                    self.injectNewPage(content, jsContentPath);
                }).catch(function (error) {
                    console.log(error);
                    $('#pageLoading').hide();
                    // self.changePage('errors/404', true);
                });
            });
        };
        /**
         * Inject the content in the current page
         * @param content
         * @param jsContentPath
         */
        Router.prototype.injectNewPage = function (content, jsContentPath) {
            $('#page').hide().html(content);
            if (jsContentPath !== null) {
                this.unloadRequirejs(jsContentPath);
                this.unloadRequirejs(jsContentPath.replace(this.routerBaseJsRelativity, ''));
                require([jsContentPath], function (App) {
                    $('#page').show();
                    $('#pageLoading').hide();
                }, function (err) {
                    console.log(err);
                    $('#page').show();
                    $('#pageLoading').hide();
                });
            }
        };
        /**
         * Load the content of an url and return it with a Promise
         * @param {string} url
         * @returns {Promise<string>}
         */
        Router.prototype.loadContent = function (url) {
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: url,
                    dataType: 'text',
                }).done(function (html) {
                    resolve(html);
                }).fail(function () {
                    reject();
                });
            });
        };
        /**
         * Unload data from RequireJs to be able to reinject the page
         * @param moduleName
         */
        Router.prototype.unloadRequirejs = function (moduleName) {
            // console.log('unload '+moduleName);
            var context = Context_1.Context.getGlobalContext()['requirejs'].s.contexts['_'];
            console.log('unload', moduleName, context.defined[moduleName], context.defined);
            if (typeof context.defined[moduleName] !== 'undefined') {
                delete context.defined[moduleName];
            }
            if (typeof context.urlFetched[moduleName] !== 'undefined') {
                delete context.urlFetched[moduleName];
            }
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length - 1; i >= 0; i--) {
                var script = scripts[i];
                if (script.getAttribute('data-requiremodule') === moduleName) {
                    if (script.parentNode !== null) {
                        script.parentNode.removeChild(script);
                    }
                    break;
                }
            }
        };
        return Router;
    }());
    exports.Router = Router;
});
//# sourceMappingURL=Router.js.map