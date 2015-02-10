//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function(grunt){
    var configuration = {};
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    module.registerTask('UITests', 'Build task', function(){

        if(module.configuration.tests.length > 0) {
            module.loadPlugin("grunt-mocha-phantomjs");
            module.runTask("mocha_phantomjs", {
                all: module.configuration.tests
            });
        }


    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function(){
            if(grunt.hasOwnProperty("test") && grunt.test){
                return;
            }

            var pathToSource = path.normalize(this.lastConfigurations.compile.default.src).replace(path.normalize("**/*.ts"), "");
            this.configuration = {
                tests: grunt.file.expand(path.resolve(process.cwd(), pathToSource, "**/*.test.html"))
            };

            return this.runTask("UITests");
        }
    });

    return module;
};