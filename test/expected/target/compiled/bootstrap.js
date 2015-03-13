var script = ('currentScript' in document) ? document.currentScript : document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1];
var rootDir = Array(document.location.href.replace(document.location.hash,'').split(/[/\\]/).filter(function(e, i){return script.src.split(/[/\\]/)[i] !== e;}).length).join('../');
// Bootstrap
(function (window) {
    'use strict';

    var defaultConfig = function (window) {
        window.require = window.require || {};
		window.require.baseUrl = rootDir + 'target/compiled';
		window.require.sourceDir = rootDir + 'src/';
		window.require.packages = (window.require.packages || []).concat(["application"]);

        window.__bootstrap = function () {
            document.write('<script src="' + rootDir + '../node_modules/grunt-contrib-requirejs/node_modules/requirejs/require.js" defer="defer"></script>');
        };
        document.write('<script src="' + rootDir + 'target/compiled/app.nocache.js"></script>');
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
        document.write('<link rel="stylesheet" type="text/css" href="' + rootDir + '../node_modules/mocha/mocha.css" />');
        document.write('<script src="' + rootDir + '../node_modules/mocha/mocha.js"></script>');
        document.write('<script src="' + rootDir + '../node_modules/chai/chai.js"></script>');
        document.write('<script src="' + rootDir + '../include/mochaRun.js"></script>');

        if (window.mochaPhantomJS && script.getAttribute("test").toLocaleUpperCase() == "UI") {
            
            document.write('<base href="' + rootDir + 'target/finalized/">');
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