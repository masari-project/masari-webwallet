/*
 * Copyright 2018 NumbersLab - https://github.com/NumbersLab
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "./Context", "./VueAnnotate"], function (require, exports, Context_1, VueAnnotate_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DestructableView = /** @class */ (function (_super) {
        __extends(DestructableView, _super);
        function DestructableView(data, vueData) {
            if (vueData === void 0) { vueData = null; }
            var _this = _super.call(this, vueData) || this;
            DestructableView_1.setCurrentAppView(_this);
            return _this;
        }
        DestructableView_1 = DestructableView;
        DestructableView.setCurrentAppView = function (view) {
            Context_1.Context.getGlobalContextStorage()['currentAppView'] = view;
        };
        DestructableView.getCurrentAppView = function () {
            return typeof Context_1.Context.getGlobalContextStorage()['currentAppView'] === 'undefined' ? null : Context_1.Context.getGlobalContextStorage()['currentAppView'];
        };
        /**
         * @returns {Promise<boolean>} return true if continue to redirect, false to cancel redirection
         */
        DestructableView.prototype.destruct = function () {
            return Promise.resolve();
        };
        DestructableView = DestructableView_1 = __decorate([
            VueAnnotate_1.VueClass()
        ], DestructableView);
        return DestructableView;
        var DestructableView_1;
    }(Vue));
    exports.DestructableView = DestructableView;
});
//# sourceMappingURL=DestructableView.js.map