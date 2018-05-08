/*
 * Copyright 2018 NumbersLab - https://github.com/NumbersLab
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Observable = /** @class */ (function () {
        function Observable() {
            this.observers = {};
        }
        Observable.prototype.addObserver = function (eventType, callback) {
            if (!(eventType in this.observers))
                this.observers[eventType] = [];
            this.observers[eventType].push(callback);
        };
        Observable.prototype.removeObserver = function (eventType, callback) {
            if (!(eventType in this.observers))
                return;
            for (var i in this.observers[eventType]) {
                if (this.observers[eventType][i] == callback) {
                    this.observers[eventType].splice(i, 1);
                    break;
                }
            }
        };
        Observable.prototype.notify = function (eventType, data) {
            if (eventType === void 0) { eventType = Observable.EVENT_MODIFIED; }
            if (data === void 0) { data = null; }
            if (!(eventType in this.observers))
                return;
            var observers = [];
            for (var i in this.observers[eventType]) {
                observers.push(this.observers[eventType][i]);
            }
            for (var i in observers) {
                observers[i](eventType, data);
            }
        };
        Observable.EVENT_MODIFIED = 'modified';
        return Observable;
    }());
    exports.Observable = Observable;
});
//# sourceMappingURL=Observable.js.map