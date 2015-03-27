//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    'use strict';

    var module = require(path.join(path.dirname(__dirname), "default")).init(grunt);
    var configuration = {};

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {
            this.getConfiguration();

            this.makeClear(configuration.target);

            if (typeof this.environment.uglify != "undefined") {
                configuration.uglify = {
                    options: this.environment.uglify
                };
            }

            // Step 1 = Uglify
            var fileList = {};

            // Parse libraries
            if (this.isNotEmptyObject(this.environment.libraries)) {
                for (var libraryName in this.environment.libraries) {
                    if (this.environment.libraries[libraryName]) {
                        var pathFrom = path.resolve(process.cwd(), configuration.target, libraryName, "main.js");
                        var pathTo = path.resolve(process.cwd(), configuration.source, libraryName, "main.js");
                        fileList[pathFrom] = pathTo;
                    }
                }
            }

            // Parse packages
            if (this.isNotEmptyObject(this.environment.packages)) {
                for (var packageName in this.environment.packages) {
                    if (this.environment.packages[packageName]) {
                        var pathFrom = path.resolve(process.cwd(), configuration.target, packageName, "main.js");
                        var pathTo = path.resolve(process.cwd(), configuration.source, packageName, "main.js");
                        fileList[pathFrom] = pathTo;
                    }
                }
            }

            if (typeof this.environment.uglify != "undefined") {
                configuration.uglify.minimize = {
                    files: fileList
                };
            } else {
                configuration.copy = configuration.copy || {};
                configuration.copy.libs = configuration.copy.libs || {};
                configuration.copy.libs.files = configuration.copy.libs.files || [];

                for (var libs in fileList) {
                    configuration.copy.libs.files.push({
                        src: path.basename(fileList[libs]),
                        cwd: path.dirname(fileList[libs]),
                        dest: path.dirname(libs)
                    });
                }
            }

            // Step 2 = Libs
            if (this.isNotEmptyObject(this.environment.base)) {
                var libs = {};
                var mainLib = path.resolve(process.cwd(), configuration.target, "base/main.js");

                libs[mainLib] = [];
                for (var lib in this.environment.base) {
                    libs[mainLib].push(
                        path.resolve(process.cwd(), this.environment.base[lib]) + ".js"
                    );
                }

                if (typeof this.environment.uglify != "undefined") {
                    configuration.uglify.libs = {
                        files: libs
                    };
                } else {
                    this.registerTask("mergeLibs", "Merge libs into 1 file", function () {
                        for (var lib in libs) {
                            var output = "";
                            if (grunt.util.kindOf(libs[lib]) == "array") {
                                libs[lib].forEach(function (file) {
                                    output += grunt.file.read(file)
                                });
                            } else {
                                output += grunt.file.read(libs[lib]);
                            }
                            grunt.file.write(lib, output);
                        }
                    });
                    this.runTask("mergeLibs", {default: {}}, []);
                }

            }

            // Step 3 = Resources
            if (grunt.util.kindOf(this.environment.resources) == "array" && typeof configuration.resourcePath != "undefined") {

                // Empty files
                configuration.copy = configuration.copy || {};
                configuration.copy.resources = configuration.copy.resources || {};
                configuration.copy.resources.files = configuration.copy.resources.files || [];

                // Adding files if needed
                this.environment.resources.forEach(function (resource) {
                    configuration.copy.resources.files.push({
                        cwd: path.resolve(process.cwd(), configuration.resourcePath, resource) + path.sep,
                        src: ["*.*", "**/*.*"],
                        dest: path.resolve(process.cwd(), configuration.target)
                    });
                });

                // Add process function if is set and match pattern
                if (configuration.fileCopyHandler && typeof configuration.fileCopyHandler.process == "function") {
                    configuration.copy.resources.options = configuration.copy.resources.options || {};
                    configuration.copy.resources.options.process = configuration.fileCopyHandler.process;
                    configuration.copy.resources.options.pattern = configuration.fileCopyHandler.pattern;
                }
            }

            var task;
            if (configuration.copy && Object.keys(configuration.copy).length > 0) {
                // Run Task
                this.registerTask("kelper:copy_finalization", function(){
                    module.copyFiles(configuration.copy);
                });
                task = this.runTask("kelper:copy_finalization");
            }

            this.configuration = configuration;

            // Run uglify
            this.loadPlugin("grunt-contrib-uglify");

            if (typeof this.environment.uglify != "undefined") {
                return this.runTask("uglify", configuration.uglify, ["minimize", "libs"]);
            }
            return task;
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
            var userFile = path.resolve(process.cwd(), "config/build", this.name + ".js");
            if (grunt.file.exists(userFile)) {
                var config = require(userFile)(grunt);

                //Parsing configuration
                configuration = this.mergeObjects(configuration, this.parse(config));
            } else {
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            return configuration;
        },
        parse: function (configuration) {
            var parsed = {};

            // Parsing
            if (configuration.hasOwnProperty("source")) {
                parsed.source = path.resolve(process.cwd(), configuration.source);
            }

            if (configuration.hasOwnProperty("resourcePath")) {
                parsed.resourcePath = path.resolve(process.cwd(), configuration.resourcePath);
            }

            if (configuration.hasOwnProperty("target")) {
                parsed.target = path.resolve(process.cwd(), configuration.target);
            }

            if (configuration.hasOwnProperty("fileCopyHandler")){
                parsed.fileCopyHandler = configuration.fileCopyHandler;
            }

            // Fix for RequireJS
            return parsed;
        }
    });

    return module;
};