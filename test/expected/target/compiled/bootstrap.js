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
            document.write('<script src="' + rootDir + '../node_modules/requirejs/require.js" defer="defer"></script>');
        };
        document.write('<script src="' + rootDir + 'target/compiled/app.nocache.js"></script>');
    };

    if (script.getAttribute("test")) {
        if (window.mochaPhantomJS)
            document.write('<script src="' + rootDir + '../include/polyfills.js"></script>');
        document.write('<link rel="stylesheet" type="text/css" href="' + rootDir + '../node_modules/mocha/mocha.css" />');
        document.write('<script src="' + rootDir + '../node_modules/mocha/mocha.js"></script>');
        document.write('<script src="' + rootDir + '../node_modules/chai/chai.js"></script>');
        document.write('<script src="' + rootDir + '../include/mochaRun.js"></script>');

        window.__runTest = function () {
            if (window.mochaPhantomJS) {
                mochaPhantomJS.run();
            } else {
                mocha.run();
            }
        };

        if (window.__setupTest) {
            window.require = window.require || {};
            window.require.callback = function () {
                window.__setupTest(window.__runTest);
            };
        }

        if (window.mochaPhantomJS && script.getAttribute("test").toLocaleUpperCase() == "UI") {
            
            document.write('<base href="' + rootDir + 'target/finalized/">');
            document.write('<script src="app.nocache.js"></script>');
        } else {
            defaultConfig(window);
        }
    } else {
        defaultConfig(window);
    }
})(window);