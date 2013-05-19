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

    var $userAgent = (function () {
        var m;

        if ((m = /theme=(\w+)/.exec(window.location.search))) {
            return m[1];
        }

        if (navigator.userAgent.match(/iPad|iPhone/i) != null) {
            return "ios";
        }

        if (navigator.userAgent.match(/Android/i) != null) {
            return "android";
        }
    }());

    var getXmlHttpRequest = function () {
        if (typeof XMLHttpRequest !== 'undefined') {
            return new XMLHttpRequest();
        } else {
            var versions = [
                "MSXML2.XmlHttp.5.0",
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0",
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"
            ];

            var xhr;
            for(var i = 0, len = versions.length; i < len; ++i) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    return xhr;
                } catch (e) { }
            }
        }
    };

    /**
     * Encodes parameters to URI format.
     *
     * @private
     * @method serializeUrlObj
     * @param obj The object to convert.
     * @param [prefix] A prefix to apply.
     * @return {string} The serialize object.
     */
    var serializeUrlObj = function(obj, prefix) {
        var str = [];

        for (var p in obj) {
            var k = prefix ? prefix + "[" + p + "]" : p,
                v = obj[p];
            str.push(typeof(v) === "object" ?
                serializeUrlObj(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }

        return str.join("&");
    }

    function buildPayload(output, params) {
        if (output === 'json') {
            return JSON.stringify(params);
        } else if (output === 'url') {
            return serializeUrlObj(params);
        }
    }

    function decodeResponse(method, text) {
        if (method === 'text') {
            return text;
        } else if (method === 'json') {
            return JSON.parse(text);
        } else if (method === 'xml') {
            var parser = new DOMParser();
            return parser.parseFromString(text, "application/xml");
        }
    }

    var Utils = {
        /**
         * Methods related with AJAX.
         *
         * @class Ajax
         */
        Ajax : {
            /**
             * Make an AJAX request.
             *
             * @method request
             * @param options The necessary data for making the request.
             * @param options.url The URL to send the request to.
             * @param [options.params] The parameters that must be sent.
             * @param [options.method=GET] Which method to use (GET, POST, PUT, DELETE)
             * @param [options.format=url] In which format to encode the parameters (url, json).
             * @param [options.decoding=text] How the response should be decoded (text, json, xml).
             * @param [options.headers] Custom headers to send in the request.
             * @param options.done Called when the response arrives.
             * @param options.done.statusCode The status code of the response.
             * @param [options.done.response] The textual content of the response.
             */
            request : function (options) {
                var xhr = getXmlHttpRequest();

                xhr.onreadystatechange = function () {
                    if(xhr.readyState < 4) {
                        return;
                    }

                    if(xhr.status !== 200) {
                        options.done({
                            statusCode: xhr.status
                        });
                        return;
                    }

                    // all is well
                    if(xhr.readyState === 4) {
                        var decoding = options.decoding || 'text';

                        options.done({
                            statusCode: xhr.status,
                            response: decodeResponse(decoding, xhr.responseText)
                        });
                    }
                };

                var url = options.url,
                    headers = options.headers || {},
                    method = options.method || 'GET',
                    format = options.format || 'url';

                if (method === 'GET') {
                    xhr.open(method, url + "?" + buildPayload('url', options.params), true);
                } else {
                    xhr.open(method, url, true);
                }

                if ("withCredentials" in xhr) {
                    xhr.withCredentials = true;
                }

                if (format === 'url') {
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                } else if (format === 'json') {
                    xhr.setRequestHeader("Content-Type", "application/json");
                } else if (format === 'xml') {
                    xhr.setRequestHeader("Content-Type", "application/xml");
                }

                for (var k in headers) {
                    if (headers.hasOwnProperty(k)) {
                        xhr.setRequestHeader(k, headers[k]);
                    }
                }

                if (method === 'GET') {
                    xhr.send();
                } else {
                    xhr.send(buildPayload(format, options.params));
                }
            }
        },

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
            },

            /**
             * Removes an element from an array (in-place).
             *
             * @method remove
             * @static
             * @param {Array} arr The array to remove the element from.
             * @param {mixed} el The element to remove.
             */
            remove : function (arr, el) {
                for (var i = 0, ln = arr.length; i < ln; ++i) {
                    if (arr[i] === el) {
                        arr.splice(i, 0);
                        return;
                    }
                }
            },

            /**
             * Move an element of the array to another position.
             * Stolen from: http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
             *
             * @method moveElement
             * @param {Array} arr The array to modify.
             * @param {Number} pos1 The position where the element is at.
             * @param {Number} pos2 The position where the element must be moved to.
             */
            moveElement : function(arr, pos1, pos2) {
                // local variables
                var i, tmp;
                // cast input parameters to integers
                pos1 = parseInt(pos1, 10);
                pos2 = parseInt(pos2, 10);
                // if positions are different and inside array
                if (pos1 !== pos2 && 0 <= pos1 && pos1 <= arr.length && 0 <= pos2 && pos2 <= arr.length) {
                    // save element from position 1
                    tmp = arr[pos1];
                    // move element down and shift other elements up
                    if (pos1 < pos2) {
                        for (i = pos1; i < pos2; i++) {
                            arr[i] = arr[i + 1];
                        }
                    }
                    // move element up and shift other elements down
                    else {
                        for (i = pos1; i > pos2; i--) {
                            arr[i] = arr[i - 1];
                        }
                    }
                    // put element from position 1 to destination
                    arr[pos2] = tmp;
                }
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
            },

            /**
             * Retrieves the absolute x and y components of the provided element,
             * relative to its closest parent with position absolute.
             *
             * @method getPosition
             * @param {HTMLElement} el The element to calculate the position of.
             * @return {Object} x and y
             */
            getPosition : function (el) {
                var currentEl = el,
                    ret = {
                        x: 0,
                        y: 0
                    };

                do {
                    ret.x += currentEl.offsetLeft;
                    ret.y += currentEl.offsetTop;
                } while (currentEl = currentEl.offsetParent);

                return ret;
            },

            /**
             * Retrieves the absolute x and y components of the provided element,
             * relative to its closest parent with position absolute and the
             * elements position.
             *
             * @method getRect
             * @param {HTMLElement} el The element to calculate the position of.
             * @return {Object} x, y, width and height
             */
            getRect : function (el) {
                var ret = Utils.Dom.getPosition(el);
                ret.width = el.offsetWidth;
                ret.height = el.offsetHeight;
                return ret;
            },

            /**
             * Retrieves the absolute x and y components of the provided element,
             * relative to its closest parent with position absolute.
             *
             * @method getAbsolutePosition
             * @param {HTMLElement} el The element to calculate the position of.
             * @return {Object} x and y
             */
            getAbsolutePosition : function (el) {
                var currentEl = el,
                    ret = {
                        x: 0,
                        y: 0
                    };

                while (currentEl && currentEl.style.position !== 'absolute') {
                    ret.x += currentEl.offsetLeft;
                    ret.y += currentEl.offsetTop;
                    currentEl = currentEl.offsetParent;
                    break;
                }

                return ret;
            },

            /**
             * Retrieves the dimensions of an element, excluding padding, margins and borders.
             *
             * @method getDimensions
             * @param {HTMLElement} el The element to calculate the dimensions of.
             * @return {Object} width and height
             */
            getDimensions : function (el) {
                var style = window.getComputedStyle(el, null);
                return {
                    width: parseFloat(style.getPropertyValue("width")),
                    height: parseFloat(style.getPropertyValue("height"))
                }
            },

            userAgent : function () {
                return $userAgent;
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
