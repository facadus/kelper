//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    'use strict';

    var module = require(path.join(path.dirname(__dirname), "default")).init(grunt);
    var configuration = {};

    module.registerTask("UnitTests", "Running Unit Tests", function () {

        if (grunt.util.kindOf(module.configuration.unitFiles) == "array" && module.configuration.unitFiles.length > 0) {
            module.loadPlugin("grunt-mocha-phantomjs");
            module.runTask("mocha_phantomjs", {
                all: {
                    options: {
                        timeout: 30000,
                        urls: module.configuration.unitFiles.map(function (item) {
                            return "file:///" + item;
                        })
                    }
                }
            });
        }

    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {

            if (grunt.hasOwnProperty("test") && grunt.test) {
                return;
            }

            this.getConfiguration();
            var compileConfig = require("../compile/main").init(grunt).getConfiguration();

            var pathToSource = path.normalize(compileConfig.default.src).replace(path.normalize("**/*.ts"), "");
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
        },
        getConfiguration: function () {
            // Load default configuration
            var configFile = path.resolve(__dirname, "config/default.json");
            if (grunt.file.exists(configFile)) {
                try {
                    configuration = grunt.file.readJSON(configFile);
                    grunt.log.debug(this.name + " plugin default configuration is loaded!");
                } catch (ex) {
                    grunt.log.error("[ERROR] " + this.name + " plugin default configuration has error!");
                    configuration = {};
                }
            }

            // Load user created configuration
            var userFile = path.resolve(process.cwd(), "config/build/test.js");
            if (grunt.file.exists(userFile)) {
                var config = require(userFile)(grunt);

                //Parsing configuration
                configuration = this.mergeObjects(configuration, this.parse(config));
            } else {
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            return configuration;
        },
        parse: function(configuration){
            var parsed = {};

            if (configuration.hasOwnProperty("source")) {
                parsed.patter = configuration.unitTestPattern;
            }

            return parsed;
        }
    });

    return module;
};