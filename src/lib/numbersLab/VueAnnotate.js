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
    var __extends2 = (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) {
                for (var p in b)
                    if (b.hasOwnProperty(p))
                        d[p] = b[p];
            };
        return function (d, b) {
            extendStatics(d, b);
            var __ = function () { this.constructor = d; };
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    function VueClass() {
        return function (target) {
            var instance = (function (_super) {
                __extends2(class_1, _super);
                function class_1() {
                    var args = Array.prototype.slice.call(arguments);
                    var initParams = { el: '', data: {} };
                    if (args.length >= 1 && typeof args[0] == 'string') {
                        initParams = {
                            el: args[0],
                            data: {},
                            watch: {},
                            computed: {},
                            updated: undefined,
                        };
                        if (typeof this['metadata'] !== 'undefined') {
                            var metadata = this['metadata'];
                            for (var varName in metadata.vars) {
                                _super[varName] = metadata.vars[varName];
                                initParams.data[varName] = metadata.vars[varName];
                            }
                            for (var varName in metadata.watch) {
                                var descriptor = metadata.watch[varName];
                                if (descriptor.deep)
                                    initParams.watch[varName] = {
                                        handler: this[descriptor.funcName],
                                        deep: true
                                    };
                                else
                                    initParams.watch[varName] = this[descriptor.funcName];
                            }
                            for (var index in metadata.computed) {
                                var descriptor = metadata.computed[index];
                                if (typeof initParams.computed[descriptor.bindOn] === 'undefined')
                                    initParams.computed[descriptor.bindOn] = {};
                                initParams.computed[descriptor.bindOn][descriptor.action] = this[descriptor.name];
                            }
                            if (metadata.updated !== null) {
                                initParams.updated = this[metadata.updated];
                            }
                            if (metadata.mounted !== null) {
                                initParams.mounted = this[metadata.mounted];
                            }
                        }
                        args.push(initParams);
                    }
                    var _this = _super !== null && _super.apply(this, args) || this;
                    return _this;
                }
                return class_1;
            }(target));
            return instance;
        };
    }
    exports.VueClass = VueClass;
    function VueWatched(listenedPropertyOrDeep, deep) {
        if (listenedPropertyOrDeep === void 0) { listenedPropertyOrDeep = ''; }
        if (deep === void 0) { deep = false; }
        return function (target, propertyKey, descriptor) {
            if (typeof target['metadata'] === 'undefined')
                target['metadata'] = { watch: {}, vars: {}, computed: [], updated: null, mounted: null, params: {} };
            var listenedProperty = '';
            if (listenedPropertyOrDeep === true) {
                deep = true;
                listenedPropertyOrDeep = null;
            }
            else if (listenedPropertyOrDeep === false) {
                deep = false;
                listenedPropertyOrDeep = null;
            }
            else if (listenedPropertyOrDeep === null) {
                listenedPropertyOrDeep = '';
            }
            else {
                listenedProperty = listenedPropertyOrDeep;
            }
            if (listenedProperty === '') {
                var wordsResearch = ['Watch'];
                for (var _i = 0, wordsResearch_1 = wordsResearch; _i < wordsResearch_1.length; _i++) {
                    var wordResearch = wordsResearch_1[_i];
                    if (propertyKey.indexOf(wordResearch) === propertyKey.length - wordResearch.length) {
                        listenedProperty = propertyKey.substr(0, propertyKey.length - wordResearch.length);
                        break;
                    }
                }
            }
            // console.log(listenedProperty);
            target['metadata'].watch[listenedProperty] = { funcName: propertyKey, deep: deep };
        };
    }
    exports.VueWatched = VueWatched;
    function VueVar(defaultValue) {
        if (defaultValue === void 0) { defaultValue = null; }
        return function PropertyDecorator(target, propertyKey) {
            if (typeof target['metadata'] === 'undefined')
                target['metadata'] = { watch: {}, vars: {}, computed: [], updated: null, mounted: null, params: {} };
            target['metadata'].vars[propertyKey] = defaultValue;
        };
    }
    exports.VueVar = VueVar;
    function VueParam() {
        return function PropertyDecorator(target, propertyKey) {
            if (typeof target['metadata'] === 'undefined')
                target['metadata'] = { watch: {}, vars: {}, computed: [], updated: null, mounted: null, params: {} };
            target['metadata'].params[propertyKey] = true;
        };
    }
    exports.VueParam = VueParam;
    function VueUpdated() {
        return function PropertyDecorator(target, propertyKey) {
            if (typeof target['metadata'] === 'undefined')
                target['metadata'] = { watch: {}, vars: {}, computed: [], updated: null, mounted: null, params: {} };
            target['metadata'].updated = propertyKey;
        };
    }
    exports.VueUpdated = VueUpdated;
    function VueComputed(varName, action) {
        if (varName === void 0) { varName = ''; }
        if (action === void 0) { action = ''; }
        return function PropertyDecorator(target, propertyKey) {
            if (typeof target['metadata'] === 'undefined')
                target['metadata'] = { watch: {}, vars: {}, computed: [], updated: null, mounted: null, params: {} };
            if (varName == '' && action == '') {
                if (propertyKey.indexOf('get') == 0) {
                    action = 'get';
                    varName = propertyKey.charAt(3).toLowerCase() + propertyKey.substr(4);
                }
                else if (propertyKey.indexOf('set') == 0) {
                    action = 'set';
                    varName = propertyKey.charAt(3).toLowerCase() + propertyKey.substr(4);
                }
            }
            else if (action == '') {
                action = 'get';
            }
            if (varName == '') {
                varName = propertyKey;
            }
            target['metadata'].computed.push({ bindOn: varName, name: propertyKey, action: action });
        };
    }
    exports.VueComputed = VueComputed;
    function VueMounted() {
        return function PropertyDecorator(target, propertyKey) {
            if (typeof target['metadata'] === 'undefined')
                target['metadata'] = { watch: {}, vars: {}, computed: [], updated: null, mounted: null, params: {} };
            target['metadata'].mounted = propertyKey;
        };
    }
    exports.VueMounted = VueMounted;
    function VueRequireComponent(componentName) {
        return function (target) { };
    }
    exports.VueRequireComponent = VueRequireComponent;
    var allRegisteredVueComponents = {};
    function VueComponentAutoRegister(componentName) {
        return function (target) {
            if (typeof allRegisteredVueComponents[componentName] !== 'undefined') {
                var instance_1 = new target();
                if (typeof instance_1.metadata !== 'undefined') {
                    var metadata_1 = instance_1.metadata;
                    var props = [];
                    for (var iProp in metadata_1.params) {
                        props.push(iProp);
                    }
                    var data = function () {
                        // __extends2(target, this);
                        for (var i in instance_1) {
                            if (typeof instance_1[i] === 'function')
                                this[i] = instance_1[i];
                        }
                        target.apply(this);
                        var varsList = {};
                        for (var iVar in metadata_1.vars) {
                            if (typeof this[iVar] !== 'undefined') {
                                varsList[iVar] = this[iVar];
                            }
                            else
                                varsList[iVar] = metadata_1.vars[iVar];
                        }
                        return varsList;
                    };
                    var computed = {};
                    for (var index in metadata_1.computed) {
                        var descriptor = metadata_1.computed[index];
                        if (typeof computed[descriptor.bindOn] === 'undefined')
                            computed[descriptor.bindOn] = {};
                        computed[descriptor.bindOn][descriptor.action] = instance_1[descriptor.name];
                    }
                    var componentDescriptor = {
                        template: instance_1.template,
                        props: props,
                        data: data,
                        computed: computed
                    };
                    Vue.component(componentName, componentDescriptor);
                    allRegisteredVueComponents[componentName] = componentDescriptor;
                }
            }
            return target;
        };
    }
    exports.VueComponentAutoRegister = VueComponentAutoRegister;
    var allRegisteredVueFilter = {};
    function VueRequireFilter(filterName, callback) {
        return function (target) {
            if (typeof allRegisteredVueFilter[filterName] !== 'undefined' &&
                allRegisteredVueFilter[filterName] === callback) {
                console.warn('Already binded Vue Filter on ' + filterName);
            }
            else {
                Vue.filter(filterName, callback);
                allRegisteredVueFilter[filterName] = callback;
            }
            return target;
        };
    }
    exports.VueRequireFilter = VueRequireFilter;
});
//# sourceMappingURL=VueAnnotate.js.map