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

            if (typeof configuration.default != "undefined" && configuration.default.dest != "undefined") {
                this.makeClear(configuration.default.dest);
            }

            // For Debug ->
            grunt.log.debug(JSON.stringify(configuration));

            // Generating files
            this.generateAppNoCache(configuration.default.dest);
            this.generateBootstrap(configuration.default.dest);

            // Setting configuration
            this.loadPlugin("grunt-typescript");
            this.configuration = configuration;
            return this.runTask("typescript", configuration);
        },
        parse: function (configuration) {

            var parsed = {};

            // Parsing
            if (configuration.hasOwnProperty("source")) {
                parsed.src = process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + "**" + path.sep + "*.ts";
                if (parsed.hasOwnProperty("options")) {
                    parsed.options.basePath = path.normalize(configuration.source);
                } else {
                    parsed.options = {
                        basePath: path.normalize(configuration.source)
                    }
                }
            }

            if (configuration.hasOwnProperty("target")) {
                parsed.dest = process.cwd() + path.sep + path.normalize(configuration.target);
            }
            if (configuration.hasOwnProperty("version")) {
                if (parsed.hasOwnProperty("options")) {
                    parsed.options.target = configuration.version;
                } else {
                    parsed.options = {target: configuration.version};
                }
            }

            // Fix for TypeScript
            return {
                default: parsed
            };
        },
        generateConfigFile: function (destPath) {
            var pathRel = path.relative(process.cwd(), configuration.default.dest).replace(/\\/g, "/");
            var pathToLib = Array(pathRel.split(/[\/\\\\]/).length + 1).join("../");

            var fileText = "window.require = window.require || {};\n";
            fileText += "window.require.baseUrl = rootDir + '" + pathRel + "';\n";

            var deps = [];
            var packages = [];
            var packageConfig = {};

            // Parse Libraries
            if (grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0) {
                fileText += "window.require.config = window.require.config || {};\n";

                this.environment.libraries.forEach(function (library) {

                    // Packages
                    if (library.hasOwnProperty("packages")) {
                        if (library.packages.hasOwnProperty("include") && grunt.util.kindOf(library.packages.include) == "array") {
                            library.packages.include.forEach(function (pkg) {
                                // Deps
                                if (library.hasOwnProperty("autoStart")) {
                                    deps.push(pkg.name);
                                }
                                packages.push(pkg.name);
                                if (pkg.hasOwnProperty("config")) {
                                    packageConfig[pkg.name + "/main"] = pkg.config;
                                }
                            });
                        }
                    }
                });

                if (deps.length > 0) {
                    fileText += 'window.require.deps = (window.require.deps || []).concat(["' + deps.join('","') + '"]);\n';
                }
            }

            // Parse packages for configs
            if (grunt.util.kindOf(this.environment.packages) == "array" && this.environment.packages.length > 0) {
                this.environment.packages.forEach(function (pkg) {
                    if (typeof pkg == "object" && pkg.hasOwnProperty("name")) {
                        packages.push(pkg.name);
                        if (pkg.hasOwnProperty("config")) {
                            packageConfig[pkg.name + "/main"] = pkg.config;
                        }
                    } else {
                        grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                    }
                });
            }

            if (deps.concat(packages).length > 0) {
                fileText += 'window.require.packages = (window.require.packages || []).concat(["' + deps.concat(packages).join('","') + '"]);\n';
            }

            for (var index in packageConfig) {
                fileText += 'window.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]) + ";\n";
            }

            if (grunt.util.kindOf(this.environment.base) == "object") {
                fileText += "window.require.paths = window.require.paths || {};\n";
                for (var lib in this.environment.base) {
                    fileText += 'window.require.paths["' + lib + '"] = "' + path.normalize(pathToLib + this.environment.base[lib]).replace(/\\/g, "/") + '";\n';
                }
            }

            return fileText;
        },
        generateAppNoCache: function (destPath) {
            var appJs = destPath + path.sep + "app.nocache.js";
            if (!grunt.file.exists(appJs)) {
                grunt.file.write(appJs, "__bootstrap();");
            }
        },
        generateBootstrap: function (destPath) {
            var bootstrap = path.resolve(destPath, "bootstrap.js");
            var defBootstrap = path.resolve(__dirname, "config/bootstrap.js");

            var fileText = "var script = ('currentScript' in document) ? document.currentScript : document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1];\n";
            fileText += "var rootDir = Array(document.location.href.split(/[\/\\\\]/).filter(function(e, i){return script.src.split(/[\/\\\\]/)[i] !== e;}).length).join('../');\n";
            fileText += grunt.file.read(defBootstrap).replace("{compiled}", this.generateConfigFile(destPath));
            grunt.file.write(bootstrap, fileText);
        }
    });

    return module;
};