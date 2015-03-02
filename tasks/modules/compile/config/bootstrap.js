// Bootstrap
(function (window) {
    var defaultConfig = function (window) {
        {compiled}
        window.__bootstrap = function () {
            document.write('<script src="' + rootDir + '{path_kelper_module}grunt-contrib-requirejs/node_modules/requirejs/require.js" defer="defer"></script>');
        };
        document.write('<script src="' + rootDir + '{path_compiled}app.nocache.js"></script>');
    };

    if (script.getAttribute("test")) {
        document.write('<link rel="stylesheet" type="text/css" href="' + rootDir + '{path_kelper_module}mocha/mocha.css" />');
        document.write('<script src="' + rootDir + '{path_kelper_module}mocha/mocha.js"></script>');
        document.write('<script src="' + rootDir + '{path_kelper_module}chai/chai.js"></script>');
        document.write('<script src="' + rootDir + '{path_kelper_include}mochaRun.js"></script>');

        if (window.mochaPhantomJS && script.getAttribute("test").toLocaleUpperCase() == "UI") {
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