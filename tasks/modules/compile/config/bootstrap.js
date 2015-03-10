// Bootstrap
(function (window) {
    'use strict';

    var defaultConfig = function (window) {
        {compiled}
        window.__bootstrap = function () {
            document.write('<script src="' + rootDir + '{path_kelper_module}grunt-contrib-requirejs/node_modules/requirejs/require.js" defer="defer"></script>');
        };
        document.write('<script src="' + rootDir + '{path_compiled}app.nocache.js"></script>');
    };

    if (script.getAttribute("test")) {
        if (window.mochaPhantomJS && !Function.prototype.bind) {
            Function.prototype.bind = function(oThis) {
                if (typeof this !== 'function') {
                    // closest thing possible to the ECMAScript 5
                    // internal IsCallable function
                    throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
                }

                var aArgs   = Array.prototype.slice.call(arguments, 1),
                    fToBind = this,
                    fNOP    = function() {},
                    fBound  = function() {
                        return fToBind.apply(this instanceof fNOP
                                ? this
                                : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                    };

                fNOP.prototype = this.prototype;
                fBound.prototype = new fNOP();

                return fBound;
            };
        }
        document.write('<link rel="stylesheet" type="text/css" href="' + rootDir + '{path_kelper_module}mocha/mocha.css" />');
        document.write('<script src="' + rootDir + '{path_kelper_module}mocha/mocha.js"></script>');
        document.write('<script src="' + rootDir + '{path_kelper_module}chai/chai.js"></script>');
        document.write('<script src="' + rootDir + '{path_kelper_include}mochaRun.js"></script>');

        if (window.mochaPhantomJS && script.getAttribute("test").toLocaleUpperCase() == "UI") {
            {replaces}
            document.write('<base href="' + rootDir + '{path_finalized}">');
            document.write('<script src="app.nocache.js"></script>');
        } else {
            defaultConfig(window);
        }

        // Setup RunTest function
        window.__runTest = function () {
            if (window.mochaPhantomJS) {
                mochaPhantomJS.run();
            } else {
                mocha.run();
            }
        };
    } else {
        defaultConfig(window);
    }
})(window);