define(function() {
    var head = (document.head || document.getElementsByTagName('head')[0]);
    var supportsTouch = 'ontouchstart' in window;
    
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
            addClass : function (el, clazz) {
                el.className = el.className.replace(new RegExp("\\b" + clazz + "\\b"), "") + " " + clazz;
            },
            
            removeClass : function (el, clazz) {
                el.className = el.className.replace(new RegExp("\\b" + clazz + "\\b"), "");
            },
            
            fixedViewport : function () {
                var meta = document.createElement("meta");
                meta.setAttribute("name", "viewport");
                meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
                head.appendChild(meta);
            },
            
            supportsTouch : function () {
                return supportsTouch;
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