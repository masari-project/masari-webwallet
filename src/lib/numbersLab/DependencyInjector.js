/*
 * Copyright 2018 NumbersLab - https://github.com/NumbersLab
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
define(["require", "exports", "./Context"], function (require, exports, Context_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DependencyInjector = /** @class */ (function () {
        function DependencyInjector() {
            this.values = {};
        }
        DependencyInjector.prototype.getInstance = function (name, subname, createIfPossible) {
            if (subname === void 0) { subname = 'default'; }
            if (createIfPossible === void 0) { createIfPossible = true; }
            if (typeof this.values[name + '-' + subname] != 'undefined')
                return this.values[name + '-' + subname];
            if (createIfPossible)
                return this.returnBest(name, subname);
            return null;
        };
        DependencyInjector.prototype.register = function (name, object, subname) {
            if (subname === void 0) { subname = 'default'; }
            this.values[name + '-' + subname] = object;
        };
        DependencyInjector.prototype.returnBest = function (name, subname) {
            var found = this.searchFromRequireJs(name);
            console.log(name, subname, found);
            if (found != null) {
                this.register(name, new found(), subname);
            }
            return this.getInstance(name, subname, false);
        };
        DependencyInjector.prototype.searchFromRequireJs = function (name) {
            //noinspection TypeScriptUnresolvedVariable
            var loaded = window.require.s.contexts._.defined;
            var dependency = null;
            console.log(loaded);
            for (var containerName in loaded) {
                var container = loaded[containerName];
                // console.log('type', typeof container, container, container[name]);
                if (typeof container[name] != 'undefined') {
                    if (!DependencyInjector.debug)
                        return container[name];
                    else {
                        if (dependency != null) {
                            console.log('%c/!\\ Dependency injector : Multiple Classes Have the same name !! Conflict when resolving dependencies', 'background: white;color: red');
                        }
                    }
                    dependency = container[name];
                }
                else {
                    // console.log('default->', typeof container['default']);
                    if (typeof container['default'] === 'function' ||
                        typeof container['default'] === 'object') {
                        if (container['default'].name === name) {
                            if (!DependencyInjector.debug)
                                return container['default'];
                            else {
                                if (dependency != null) {
                                    console.log('%c/!\\ Dependency injector : Multiple Classes Have the same name !! Conflict when resolving dependencies', 'background: white;color: red');
                                }
                            }
                            dependency = container['default'];
                        }
                    }
                }
            }
            return dependency;
        };
        DependencyInjector.debug = true;
        return DependencyInjector;
    }());
    exports.DependencyInjector = DependencyInjector;
    function DependencyInjectorInstance() {
        if (typeof Context_1.Context.getGlobalContext()['di'] === 'undefined' ||
            Context_1.Context.getGlobalContext()['di'] === null) {
            var Inj = new DependencyInjector();
            Context_1.Context.getGlobalContext()['di'] = Inj;
            console.log('register');
        }
        return Context_1.Context.getGlobalContext()['di'];
    }
    exports.DependencyInjectorInstance = DependencyInjectorInstance;
    function Autowire() {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        // Inj.need(keys[0]);
        return function (target, key) {
            // property getter
            var getter = function () {
                var Inj = DependencyInjectorInstance();
                //console.log(Get: ${key} => ${_val});
                var subname = keys.length > 1 ? keys[1] : 'default';
                return Inj.getInstance(keys[0], subname);
            };
            // Delete property.
            if (delete target[key]) {
                Object.defineProperty(target, key, {
                    get: getter
                });
            }
        };
    }
    exports.Autowire = Autowire;
});
//# sourceMappingURL=DependencyInjector.js.map