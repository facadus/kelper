// Bootstrap
(function (window) {
    var defaultConfig = function(window){
        {compiled}
    }

    if (script.getAttribute("test")) {
        document.write('<link rel="stylesheet" type="text/css" href="' + rootDir + 'node_modules/kelper/node_modules/mocha/mocha.css" />');
        document.write('<script src="' + rootDir + 'node_modules/kelper/node_modules/mocha/mocha.js"></script>');
        document.write('<script src="' + rootDir + 'node_modules/kelper/node_modules/chai/chai.js"></script>');

        if (window.mochaPhantomJS && script.getAttribute("test").toLocaleUpperCase() == "UI") {
            document.write('<base href="' + rootDir + 'target/finalized/">');
            document.write('<script src="app.nocache.js"></script>');
        } else {
            defaultConfig(window);
            window.__bootstrap = function () {
                document.write('<script src="' + rootDir + 'node_modules/kelper/node_modules/grunt-contrib-requirejs/node_modules/requirejs/require.js" defer="defer"></script>');
            };
            document.write('<script src="' + rootDir + 'target/compiled/app.nocache.js"></script>');
        }

        // Setup Test Function
        window.__setupTest = function () {
            mocha.setup('bdd');
            window.expect = chai.expect;
            // Setup RunTest function
            window.__runTest = function () {
                if (window.mochaPhantomJS) {
                    mochaPhantomJS.run();
                } else {
                    mocha.run();
                }
            };
        };
    } else {
        defaultConfig(window);
        window.__bootstrap = function () {
            document.write('<script src="' + rootDir + 'node_modules/kelper/node_modules/grunt-contrib-requirejs/node_modules/requirejs/require.js" defer="defer"></script>');
        };
        document.write('<script src="' + rootDir + 'target/compiled/app.nocache.js"></script>');
    }
})(window);