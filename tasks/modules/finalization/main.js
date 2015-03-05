//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    module = require(path.join(path.dirname(__dirname), "default")).init(grunt);
    var configuration = {};

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {
            this.getConfiguration();

            this.makeClear(configuration.target);

            configuration.uglify = {
                options: this.environment.uglify || {}
            };

            // Step 1 = Uglify
            if (typeof this.environment.uglify != "undefined" || grunt.test) {
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
                            var pathFrom = path.resolve(process.cwd(), configuration.target, packageName, "main.js")
                            var pathTo = path.resolve(process.cwd(), configuration.source, packageName, "main.js");
                            fileList[pathFrom] = pathTo;
                        }
                    }
                }

                configuration.uglify.minimize = {
                    files: fileList
                };
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

                configuration.uglify.libs = {
                    files: libs
                };
            }

            // Step 3 = Resources
            if (grunt.util.kindOf(this.environment.resources) == "array" && typeof configuration.resourcePath != "undefined") {

                // Empty files
                configuration.copy = {
                    resources: {
                        files: []
                    }
                };

                // Adding files if needed
                this.environment.resources.forEach(function (resource) {
                    configuration.copy.resources.files.push({
                        expand: true,
                        cwd: path.resolve(process.cwd(), configuration.resourcePath, resource) + path.sep,
                        src: ["*.*", "**/*.*"],
                        dest: path.resolve(process.cwd(), configuration.target)
                    });
                });

                // Run Task
                this.loadPlugin("grunt-contrib-copy");
                this.runTask("copy", configuration.copy, "resources");
            }

            this.configuration = configuration;

            // Run uglify
            this.loadPlugin("grunt-contrib-uglify");
            return this.runTask("uglify", configuration.uglify, ["minimize", "libs"]);
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

            // Fix for RequireJS
            return parsed;
        }
    });

    return module;
};