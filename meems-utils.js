define(function() {    
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
        }
    };
    
    Function.prototype.extend = function(baseClass, newMethods) {
        Utils.extend(this, baseClass, newMethods);
    };
    
    return Utils;
});