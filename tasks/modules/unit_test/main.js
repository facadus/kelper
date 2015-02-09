//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function(grunt){
    var configuration = {};
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    module.registerTask("UnitTests", "Running Unit Tests", function(){
        module.loadPlugin("grunt-mocha-phantomjs");

        // Copying all Unit Tests
        var testPackages = [];
        if(module.configuration.packages.length > 0){
            for(var i=0; i < module.configuration.packages.length; i++){
                if(grunt.file.exists(module.configuration.packages[i] + path.sep + "UnitTests.html")){
                    testPackages.push(module.configuration.packages[i] + path.sep + "UnitTests.html");
                }
            }
        }

        module.runTask("mocha_phantomjs", {
            all: testPackages
        });
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function(){

            if(grunt.hasOwnProperty("test") && grunt.test){
                return;
            }

            var pathToSource = path.normalize(this.lastConfigurations.compile.default.src).replace(path.normalize("**/*.ts"), "");

            var packages = [];
            if(typeof this.environment.libraries != "undefined"){
                if(grunt.util.kindOf(this.environment.libraries) == "array"){
                    this.environment.libraries.forEach(function(library){
                        if(typeof library == "object" && library.hasOwnProperty("name")){
                            packages.push(path.dirname(path.resolve(process.cwd(), pathToSource, library.name, "main.js")));
                        }
                    });
                }else{
                    grunt.log.error("[ERROR] Unknown format of environment library, please fix it");
                }
            }

            // Parse packages
            if(typeof this.environment.packages != "undefined"){
                if(grunt.util.kindOf(this.environment.packages) == "array"){
                    this.environment.packages.forEach(function(pkg){
                        if(typeof pkg == "object" && pkg.hasOwnProperty("name")){
                            packages.push(path.dirname(path.resolve(process.cwd(), pathToSource, pkg.name, "main.js")));
                        }
                    });
                }else{
                    grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                }
            }

            this.configuration = {
                packages: packages
            };

            return this.runTask("UnitTests");
        }
    });

    return module;
};