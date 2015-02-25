//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    var configuration = {};
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    module.registerTask("UnitTests", "Running Unit Tests", function () {

        if (grunt.util.kindOf(module.configuration.unitFiles) == "array" && module.configuration.unitFiles.length > 0) {
            module.loadPlugin("grunt-mocha-phantomjs");
            module.runTask("mocha_phantomjs", {
                all: module.configuration.unitFiles
            });
        }

    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {

            if (grunt.hasOwnProperty("test") && grunt.test) {
                return;
            }

            var pathToSource = path.normalize(this.lastConfigurations.compile.default.src).replace(path.normalize("**/*.ts"), "");

            var packages = [];
            if (typeof this.environment.libraries != "undefined") {
                if (grunt.util.kindOf(this.environment.libraries) == "array") {
                    this.environment.libraries.forEach(function (library) {
                        if (typeof library == "object" && library.hasOwnProperty("name")) {

                            if (library.hasOwnProperty("packages")) {
                                if (library.packages.hasOwnProperty("include") && grunt.util.kindOf(library.packages.include) == "array") {
                                    library.packages.include.forEach(function (pkg) {
                                        if (typeof pkg == "object" && pkg.hasOwnProperty("name")) {
                                            packages.push(path.normalize(path.dirname(path.resolve(process.cwd(), pathToSource, pkg.name, "main.js")) + "/**/*.unit.html"));
                                        }
                                    });
                                }
                            }

                        }
                    });
                } else {
                    grunt.log.error("[ERROR] Unknown format of environment library, please fix it");
                }
            }

            // Parse packages
            if (typeof this.environment.packages != "undefined") {
                if (grunt.util.kindOf(this.environment.packages) == "array") {
                    this.environment.packages.forEach(function (pkg) {
                        if (typeof pkg == "object" && pkg.hasOwnProperty("name")) {
                            packages.push(path.normalize(path.dirname(path.resolve(process.cwd(), pathToSource, pkg.name, "main.js"))) + "/**/*.unit.html");
                        }
                    });
                } else {
                    grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                }
            }

            this.configuration = {
                unitFiles: grunt.file.expand(packages)
            };

            return this.runTask("UnitTests");
        }
    });

    return module;
};