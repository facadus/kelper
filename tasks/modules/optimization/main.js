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

            if (this.isNotEmptyObject(this.environment.libraries)) {
                configuration.default.options = this.mergeObjects(configuration.default.options, this.parseLibraries(this.environment.libraries));
            }

            if (this.isNotEmptyObject(this.environment.reqModules)) {
                this.smartMerge(configuration.default.options, this.parseRequireModules(this.environment.reqModules));
            }

            if (this.isNotEmptyObject(this.environment.packages)) {
                this.parsePackages(this.environment.packages, configuration.default.options.packages);
            }

            if (this.isNotEmptyObject(this.environment.base)) {
                configuration.default.options = this.mergeObjects(configuration.default.options, this.parseBaseLibs(this.environment.base));
            }

            if (typeof configuration.default != "undefined" && typeof configuration.default.options.dir != "undefined") {
                this.makeClear(configuration.default.options.dir);
            }

            // Set SourcePath
            configuration.default.options.sourcePath = this.lastConfigurations.compile.default.sourcePath;

            // For Debug ->
            grunt.log.debug(JSON.stringify(configuration));

            // Make bundles
            configuration.default.options.done = function (done, output) {
                var bundles = require('rjs-build-analysis').parse(output);
                var output = {};
                if (bundles.hasOwnProperty("bundles") && grunt.util.kindOf(bundles.bundles) == "array") {
                    bundles.bundles.forEach(function (bundle) {
                        output[(bundle.parent.substr(0, bundle.parent.lastIndexOf('/main')) || bundle.parent)] = bundle.children.map(function (bnd) {
                            return (bnd.substr(0, bnd.lastIndexOf('.')) || bnd);
                        });
                    });
                }
                module.configuration = module.mergeObjects(module.configuration, {
                    bundles: output
                });
                done();
            };

            this.configuration = configuration;

            // Setting configuration
            this.loadPlugin("grunt-contrib-requirejs");
            return this.runTask("requirejs", configuration);
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
                parsed.baseUrl = path.resolve(process.cwd(), configuration.source);
            }

            if (configuration.hasOwnProperty("target")) {
                parsed.dir = path.resolve(process.cwd(), configuration.target);
            }

            // Fix for RequireJS
            return {
                default: {
                    options: parsed
                }
            };
        },
        parseLibraries: function (source) {
            var parsed = {
                modules: [],
                packages: [],
                paths: {}
            };

            for (var libraryName in source) {
                var library = source[libraryName];

                // Check each library and library name
                if (library) {
                    var includes = [];
                    var excludes = [];
                    var includeRequire = [];

                    // Check packages
                    if (this.isNotEmptyObject(library.packages)) {
                        for (var packageName in library.packages) {
                            var pkg = library.packages[packageName];

                            if (typeof pkg == "boolean") {
                                excludes.push(packageName);
                            } else {
                                includes.push(packageName);

                                includeRequire.push(
                                    pkg.requireName ? pkg.requireName : packageName
                                );

                                if (pkg.replace) {
                                    parsed.paths = this.mergeObjects(parsed.paths, pkg.replace);
                                }
                            }
                        }
                    }

                    parsed.modules.push({
                        name: libraryName,
                        include: includes,
                        exclude: excludes,
                        insertRequire: includeRequire,
                        create: true
                    });

                    parsed.packages.push(libraryName);
                }

                parsed.packages = parsed.packages.concat(includes);
            }

            return parsed;
        },
        parseBaseLibs: function (libs) {
            var paths = {};
            for (var lib in libs) {
                paths[lib] = "empty:";
            }
            return {
                paths: paths
            };
        },
        parsePackages: function (packages, confPackages) {
            var parsed = confPackages || [];

            for (var packageName in packages) {
                var pkg = packages[packageName];

                if (pkg) {
                    parsed.push(packageName);
                    if (pkg.replace) {
                        parsed.paths = this.mergeObjects(parsed.paths, pkg.replace);
                    }
                }
            }

            confPackages = parsed;
        },
        parseRequireModules: function (reqModules) {
            var result = {};

            for (var lib in reqModules) {
                var reqModulePath = reqModules[lib]
                    .replace("{path.fromKelper}", this.modulePath)
                    .replace("{path.fromSource}", path.resolve(process.cwd(), this.lastConfigurations.compile.default.sourcePath))
                    .replace("{path.fromRoot}", process.cwd());
                result[lib] = path.normalize(reqModulePath);
            }

            return {
                paths: result,
                stubModules: Object.keys(result)
            };
        }
    });

    return module;
};