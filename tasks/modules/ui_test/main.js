//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    var configuration = {};
    module = require(path.join(path.dirname(__dirname), "default")).init(grunt);

    module.registerTask('UITests', 'Build task', function () {

        if (grunt.util.kindOf(module.configuration.uiTests) == "array" && module.configuration.uiTests.length > 0) {
            module.loadPlugin("grunt-mocha-phantomjs");
            module.runTask("mocha_phantomjs", {
                all: module.configuration.uiTests
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
                                    packages.push(path.normalize(packagePath + "/**/*.test.html"));
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
                        packages.push(path.normalize(packagePath + "/**/*.test.html"));
                    }
                }
            }

            this.configuration = {
                uiTests: grunt.file.expand(packages)
            };

            return this.runTask("UITests");
        }
    });

    return module;
};