var script = ('currentScript' in document) ? document.currentScript : document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1];
var rootDir = Array(document.location.href.split(/[/\\]/).filter(function(e, i){return script.src.split(/[/\\]/)[i] !== e;}).length).join('../');
// Bootstrap
(function (window) {
    var defaultConfig = function(window){
        window.require = window.require || {};
		window.require.baseUrl = rootDir + 'target/compiled';
		window.require.packages = (window.require.packages || []).concat(["application"]);
		window.require.paths = window.require.paths || {};

        window.__bootstrap = function () {
            document.write('<script src="' + rootDir + '..\node_modulesgrunt-contrib-requirejs/node_modules/requirejs/require.js" defer="defer"></script>');
        };
        document.write('<script src="' + rootDir + 'C:\work\projects\sample_builder\test\target\compiledapp.nocache.js"></script>');
    }

    if (script.getAttribute("test")) {
        document.write('<link rel="stylesheet" type="text/css" href="' + rootDir + '{path_kelper_module}mocha/mocha.css" />');
        document.write('<script src="' + rootDir + '{path_kelper_module}mocha/mocha.js"></script>');
        document.write('<script src="' + rootDir + '{path_kelper_module}chai/chai.js"></script>');

        if (window.mochaPhantomJS && script.getAttribute("test").toLocaleUpperCase() == "UI") {
            document.write('<base href="' + rootDir + 'target/finalized">');
            document.write('<script src="app.nocache.js"></script>');
        } else {
            defaultConfig(window);
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
    }
})(window);