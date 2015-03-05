//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    var configuration = {};
    module = require(path.join(path.dirname(__dirname), "default")).init(grunt);

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

            // Parse libraries
            if (this.isNotEmptyObject(this.environment.libraries)) {
                for (var libraryName in this.environment.libraries) {
                    var library = this.environment.libraries[libraryName];

                    // Check each library and library name
                    if (library) {
                        // Check packages
                        if (this.isNotEmptyObject(library.packages)) {
                            for (var packageName in library.packages) {
                                var pkg = library.packages[packageName];

                                // Check package and package name
                                if (pkg) {
                                    var packagePath = path.dirname(
                                        path.resolve(process.cwd(), pathToSource, packageName, "main.js")
                                    );
                                    packages.push(path.normalize(packagePath + "/**/*.unit.html"));
                                }
                            }
                        }
                    }
                }
            }

            // Parse packages
            if (this.isNotEmptyObject(this.environment.packages)) {
                for (var packageName in this.environment.packages) {
                    var pkg = this.environment.packages[packageName];

                    // Check package and package name
                    if (pkg) {
                        var packagePath = path.dirname(
                            path.resolve(process.cwd(), pathToSource, packageName, "main.js")
                        );
                        packages.push(path.normalize(packagePath + "/**/*.unit.html"));
                    }
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