define(function() {
    var head = (document.head || document.getElementsByTagName('head')[0]),
        supportsTouch = 'ontouchstart' in window,
        pendingDomClassNameChanges = {},
        pendingHtmlMods = {},
        elmId = 0,
        elementsById = {};
    
    var Utils = {
        /**
         * Used for extending classes.
         */
        extend : function (newClass, classToExtend, newMethods) {
            if (typeof newClass === 'function') {
                newClass.prototype = new classToExtend();
                newClass.constructor = newClass;
                newClass = newClass.prototype;
            }
            
            for (var k in newMethods) {
                if (newMethods.hasOwnProperty(k)) {
                    newClass[k] = newMethods[k];
                }
            }
        },
        
        Map : {
            getKeys : function (map) {
                var keys = [];
                
                for (var k in map) {
                    if (map.hasOwnProperty(k)) {
                        keys.push(k);
                    }
                }
                
                return keys;
            }
        },
        
        Dom : {
            getClass : function (el) {
                if (!el._meems_uid) {
                    el._meems_uid = ++elmId;
                    elementsById[el._meems_uid] = el;
                    pendingDomClassNameChanges[el._meems_uid] = el.className;
                } else if (!(el._meems_uid in pendingDomClassNameChanges) || !pendingDomClassNameChanges[el._meems_uid]) {
                    pendingDomClassNameChanges[el._meems_uid] = el.className;
                }
                
                return pendingDomClassNameChanges[el._meems_uid];
            },
            
            addClass : function (el, clazz) {
                var currentClass = this.getClass(el);
                pendingDomClassNameChanges[el._meems_uid] = currentClass.replace(new RegExp("\\b" + clazz + "\\b"), "") + " " + clazz;
            },
            
            removeClass : function (el, clazz) {
                var currentClass = this.getClass(el);
                pendingDomClassNameChanges[el._meems_uid] = currentClass.replace(new RegExp("\\b" + clazz + "\\b"), "");
            },
            
            setClass : function (el, clazz)  {
                if (!el._meems_uid) {
                    el._meems_uid = ++elmId;
                    elementsById[el._meems_uid] = el;
                }
                pendingDomClassNameChanges[el._meems_uid] = clazz;
            },
            
            setHtml : function (el, html) {
                if (!el._meems_uid) {
                    el._meems_uid = ++elmId;
                    elementsById[el._meems_uid] = el;
                }
                pendingHtmlMods[el._meems_uid] = html;
            },
            
            fixedViewport : function () {
                var meta = document.createElement("meta");
                meta.setAttribute("name", "viewport");
                meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
                head.appendChild(meta);
            },
            
            supportsTouch : function () {
                return supportsTouch;
            },
            
            applyChanges : function () {
                var newClassName, newHtml, uid;
                
                for (uid in pendingDomClassNameChanges) {
                    if (pendingDomClassNameChanges.hasOwnProperty(uid)) {
                        newClassName = pendingDomClassNameChanges[uid];
                        if (newClassName) {
                            elementsById[uid].className = newClassName;
                        }
                    }
                }
                
                for (uid in pendingHtmlMods) {
                    if (pendingHtmlMods.hasOwnProperty(uid)) {
                        newHtml = pendingHtmlMods[uid];
                        if (newHtml) {
                            elementsById[uid].innerHTML = newHtml;
                        }
                    }
                }
                
                pendingDomClassNameChanges = {};
                pendingHtmlMods = {};
                
            }
        },
        
        postPone : function (fn) {
            setTimeout(fn, 10);
        },
        
        bind : function (fn, self) {
            return function () {
                fn.apply(self, arguments);
            };
        },
        
        throttle : function (fn, ms) {
            var lastCall, now;
            return function () {
                now = (new Date()).getTime();
                if (!lastCall || now - lastCall > ms) {
                    var ret = fn.apply(this, arguments);
                    lastCall = now;
                    return ret;
                }
            };
        },
        
        indexOfByProp : function (arr, prop, value) {
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i][prop] === value) {
                    return i;
                }
            }
            
            return -1;
        }
    };
    
    if (Function.prototype.extend === undefined) {
        Function.prototype.extend = function(baseClass, newMethods) {
            Utils.extend(this, baseClass, newMethods);
        };
    }
    
    return Utils;
});