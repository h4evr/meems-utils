/*global define*/
/**
 * Contains a set of methods that facilitate several tasks.
 * @module meems-utils
 */
define(function () {
    "use strict";

    var head = (document.head || document.getElementsByTagName('head')[0]),
        supportsTouch = 'ontouchstart' in window,
        pendingDomClassNameChanges = {},
        pendingHtmlMods = {},
        elmId = 0,
        elementsById = {};

    var Utils = {
        /**
         * Methods related with function manipulation.
         *
         * @class Fn
         */
        Fn : {
            /**
             * Used for extending classes.

             * @method extend
             * @static
             * @param {Function|Object} newClass The new class that will contain the extended methods.
             * @param {Function} ClassToExtend Base class.
             * @param {Object} newMethods Object with all the new methods.
             */
            extend : function (newClass, ClassToExtend, newMethods) {
                if (typeof newClass === 'function') {
                    newClass.prototype = new ClassToExtend();
                    newClass.constructor = newClass;
                    newClass = newClass.prototype;
                }

                for (var k in newMethods) {
                    if (newMethods.hasOwnProperty(k)) {
                        newClass[k] = newMethods[k];
                    }
                }
            },

            /**
             * Postpones the invocation of a function until the current method chain is finished.
             *
             * @method postPone
             * @static
             * @param {Function} fn The function to be called
             */
            postPone : function (fn) {
                setTimeout(fn, 10);
            },

            /**
             * Binds the 'this' variable of a function to the given variable.
             *
             * @method bind
             * @static
             * @param {Function} fn The function to be bind-ed.
             * @param {Object} self The new 'this'.
             * @return {Function} The bind-ed function.
             */
            bind : function (fn, self) {
                return function () {
                    fn.apply(self, arguments);
                };
            },

            /**
             * Ensures a function is called at most once in the given time interval.
             *
             * @method throttle
             * @static
             * @param {Function} fn The function to be protected.
             * @param {Number} ms How many milliseconds must pass before the function can be called again.
             * @return {Function} The protected function.
             */
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
            }
        },

        /**
         * All methods related to array manipulation.
         *
         * @class Array
         */
        Array : {
            /**
             * Allows to search an array of objects by a property of those objects.
             *
             * @method indexOfByProp
             * @static
             * @param {Array} arr The array to be searched.
             * @param {String} prop The name of the property to be matched.
             * @param {*} value The value to match.
             * @return {number} The position of the matched element in the array,
             *                   -1 if none matched the criteria.
             */
            indexOfByProp : function (arr, prop, value) {
                for (var i = 0; i < arr.length; ++i) {
                    if (arr[i][prop] === value) {
                        return i;
                    }
                }

                return -1;
            }
        },

        /**
         * All methods related to map manipulation.
         *
         * @class Map
         */
        Map : {
            /**
             * Extracts all the keys from a map object.
             *
             * @method getKeys
             * @static
             * @param {Object} map The map to extract keys from.
             * @return {String[]} Array with the keys.
             */
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

        /**
         * All methods related with DOM manipulation.
         *
         * @class Dom
         */
        Dom : {
            /**
             * Retrieves the className of an element.
             * Using this method is required when using other methods from this namespace,
             * because it will return the most recent changes (even before calling applyChanges).
             *
             * @method getClass
             * @static
             * @param {HTMLElement} el The element to retrieve the className from.
             * @return {String} The className.
             */
            getClass : function (el) {
                if (!el.$meems_uid) {
                    el.$meems_uid = ++elmId;
                    elementsById[el.$meems_uid] = el;
                    pendingDomClassNameChanges[el.$meems_uid] = el.className;
                } else if (!(el.$meems_uid in pendingDomClassNameChanges) || !pendingDomClassNameChanges[el.$meems_uid]) {
                    pendingDomClassNameChanges[el.$meems_uid] = el.className;
                }
                
                return pendingDomClassNameChanges[el.$meems_uid];
            },

            /**
             * Append a new class name to an element.
             *
             * @method addClass
             * @static
             * @param {HTMLElement} el The element to add the class name to.
             * @param {String} clazz The class name to add.
             */
            addClass : function (el, clazz) {
                var currentClass = this.getClass(el);
                pendingDomClassNameChanges[el.$meems_uid] = currentClass.replace(new RegExp("\\b" + clazz + "\\b"), "") + " " + clazz;
            },

            /**
             * Remove a class name from an element.
             *
             * @method removeClass
             * @static
             * @param {HTMLElement} el Element to remove the class name from.
             * @param {String} clazz The class name to remove.
             */
            removeClass : function (el, clazz) {
                var currentClass = this.getClass(el);
                pendingDomClassNameChanges[el.$meems_uid] = currentClass.replace(new RegExp("\\b" + clazz + "\\b"), "");
            },

            /**
             * Replace the className of an element.
             *
             * @method setClass
             * @static
             * @param {HTMLElement} el The element to set the className of.
             * @param {String} clazz The new className.
             */
            setClass : function (el, clazz)  {
                if (!el.$meems_uid) {
                    el.$meems_uid = ++elmId;
                    elementsById[el.$meems_uid] = el;
                }
                pendingDomClassNameChanges[el.$meems_uid] = clazz;
            },

            /**
             * Set the innerHTML property of an element.
             *
             * @method setHtml
             * @static
             * @param {HTMLElement} el The element to change.
             * @param {String} html The new innerHTML property.
             */
            setHtml : function (el, html) {
                if (!el.$meems_uid) {
                    el.$meems_uid = ++elmId;
                    elementsById[el.$meems_uid] = el;
                }
                pendingHtmlMods[el.$meems_uid] = html;
            },

            /**
             * Applies all the changes made by the addClass, setClass, removeClass, setHtml methods.
             * This is a way to reduce DOM manipulation, speeding up the update process.
             *
             * @method applyChanges
             * @static
             */
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
                
            },

            /**
             * Add a meta tag to the head element, disabling zooming and fixing the viewport.
             * Use only when you can't easily add the tag yourself to the HTML file.
             *
             * @method fixedViewport
             * @static
             */
            fixedViewport : function () {
                var meta = document.createElement("meta");
                meta.setAttribute("name", "viewport");
                meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
                head.appendChild(meta);
            },

            /**
             * Checks if the browser supports touch events.
             *
             * @method supportsTouch
             * @static
             * @return {boolean} True if it supports touch events, false otherwise.
             */
            supportsTouch : function () {
                return supportsTouch;
            }
        }
    };
    
    if (Function.prototype.extend === undefined) {
        Function.prototype.extend = function (baseClass, newMethods) {
            Utils.Fn.extend(this, baseClass, newMethods);
        };
    }
    
    return Utils;
});
