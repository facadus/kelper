// Bootstrap
(function (window) {
    'use strict';

    var defaultConfig = function (window) {
        {compiled}
        window.__bootstrap = function () {
            document.write('<script src="' + rootDir + '{path_requirejs}require.js" defer="defer"></script>');
        };
        document.write('<script src="' + rootDir + '{path_compiled}app.nocache.js"></script>');
    };

    if (script.getAttribute("test")) {
        if (window.mochaPhantomJS)
            document.write('<script src="' + rootDir + '{path_kelper_include}polyfills.js"></script>');
        document.write('<link rel="stylesheet" type="text/css" href="' + rootDir + '{path_mocha}mocha.css" />');
        document.write('<script src="' + rootDir + '{path_mocha}mocha.js"></script>');
        document.write('<script src="' + rootDir + '{path_chai}chai.js"></script>');
        document.write('<script src="' + rootDir + '{path_kelper_include}mochaRun.js"></script>');

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
            {replaces}
            document.write('<base href="' + rootDir + '{path_finalized}">');
            document.write('<script src="app.nocache.js"></script>');
        } else {
            defaultConfig(window);
        }
    } else {
        defaultConfig(window);
    }
})(window);