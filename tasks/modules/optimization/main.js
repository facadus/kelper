//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);
    var configuration = {};

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {
            this.getConfiguration();

            if (typeof this.environment.libraries != "undefined") {
                configuration.default.options = this.mergeObjects(configuration.default.options, this.parseLibraries(this.environment.libraries));
            }

            if (typeof this.environment.packages != "undefined") {
                this.parsePackages(this.environment.packages, configuration.default.options.packages);
            }

            if (typeof this.environment.base != "undefined") {
                configuration.default.options = this.mergeObjects(configuration.default.options, this.parseBaseLibs(this.environment.base));
            }

            if (typeof configuration.default != "undefined" && typeof configuration.default.options.dir != "undefined") {
                this.makeClear(configuration.default.options.dir);
            }

            // For Debug ->
            grunt.log.debug(JSON.stringify(configuration));

            // ToDo: Make it normally
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
            }

            this.configuration = configuration;

            // Setting configuration
            this.loadPlugin("grunt-contrib-requirejs");
            return this.runTask("requirejs", configuration);
        },
        getConfiguration: function () {
            // Load default configuration
            if (grunt.file.exists(__dirname + path.sep + "config" + path.sep + "default.json")) {
                try {
                    configuration = grunt.file.readJSON(__dirname + path.sep + "config" + path.sep + "default.json");
                    grunt.log.debug(this.name + " plugin default configuration is loaded!");
                } catch (ex) {
                    grunt.log.error("[ERROR] " + this.name + " plugin default configuration has error!");
                    configuration = {};
                }
            }

            // Load user created configuration
            if (grunt.file.exists(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + this.name + ".js")) {
                var config = require(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + this.name + ".js")(grunt);

                //Parsing configuration
                configuration = this.mergeObjects(configuration, this.parse(config));
            } else {
                grunt.log.debug(this.name + " user configuration not found, continue");
            }
        },
        parse: function (configuration) {

            var parsed = {};

            // Parsing
            if (configuration.hasOwnProperty("source")) {
                parsed.baseUrl = process.cwd() + path.sep + path.normalize(configuration.source);
            }
            if (configuration.hasOwnProperty("target")) {
                parsed.dir = process.cwd() + path.sep + path.normalize(configuration.target);
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
                packages: []
            };

            source.forEach(function (library) {
                // Push Modules
                if (library.hasOwnProperty("packages") && library.packages.hasOwnProperty("include")) {
                    var includes = [];
                    var excludes = [];

                    // Include
                    library.packages.include.forEach(function (pkg) {
                        includes.push(pkg.name);
                    });

                    // Exclude
                    if (library.packages.hasOwnProperty("exclude")) {
                        library.packages.exclude.forEach(function (pkg) {
                            excludes.push(pkg.name);
                        });
                    }

                    parsed.modules.push({
                        name: library.name,
                        include: includes,
                        exclude: excludes,
                        insertRequire: includes,
                        create: true
                    });

                    parsed.packages.push(library.name);
                }
                parsed.packages = parsed.packages.concat(includes);
            });

            return parsed;
        },
        parseBaseLibs: function (libs) {
            var paths = {};
            for (var lib in libs) {
                paths[lib] = "empty:";
            }
            return {paths: paths};
        },
        parsePackages: function (packages, confPackages) {
            var parsed = confPackages || [];
            if (grunt.util.kindOf(packages) == "array") {
                packages.forEach(function (pkg) {
                    if (typeof pkg == "object" && pkg.hasOwnProperty("name")) {
                        parsed.push(pkg.name);
                    }
                });
            }
            confPackages = parsed;
        }
    });

    return module;
};