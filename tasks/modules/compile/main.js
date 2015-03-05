//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    var configuration = {};
    var baseConfig = null;

    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    module.registerTask("addDependencies", "Adding dependencies to files", function () {
        // Load library
        var deps = require("./include/dependencies").init(grunt);
        var depsPath = path.resolve(process.cwd(), configuration.default.dest);
        // Get Modules with dependencies
        deps.findDependencies(module.environment);
        deps.addFoundDependenciesToFiles(depsPath);
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {
            this.getConfiguration();

            if (typeof configuration.default != "undefined" && configuration.default.dest != "undefined") {
                this.makeClear(configuration.default.dest);
            }

            // For Debug ->
            grunt.log.debug(JSON.stringify(configuration));

            // Generating files
            this.generateAppNoCache(configuration.default.dest);
            this.generateBootstrap(configuration.default.sourcePath, configuration.default.dest);


            // Setting configuration
            this.loadPlugin("grunt-typescript");
            this.configuration = configuration;
            var task = this.runTask("typescript", configuration);
            this.runTask("addDependencies", {default: {}}, []);
            return task;
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

            return configuration;
        },
        parse: function (configuration) {

            var parsed = {};

            // Parsing
            if (configuration.hasOwnProperty("source")) {
                parsed.sourcePath = process.cwd() + path.sep + path.normalize(configuration.source);
                parsed.src = parsed.sourcePath + path.sep + "**" + path.sep + "*.ts";
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

            if (configuration.hasOwnProperty("baseConfig") && typeof configuration.baseConfig == "function") {
                baseConfig = configuration.baseConfig;
            }

            // Fix for TypeScript
            return {
                default: parsed
            };
        },
        generateConfigFile: function (srcPath, destPath) {
            var pathRel = path.relative(process.cwd(), configuration.default.dest).replace(/\\/g, "/");
            var pathToLib = Array(pathRel.split(/[\/\\\\]/).length + 1).join("../");

            var fileText = "window.require = window.require || {};\n";
            fileText += "\t\twindow.require.baseUrl = rootDir + '" + pathRel + "';\n";

            var deps = [];
            var packages = [];
            var packageConfig = {};

            // Parse Libraries
            if (grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0) {
                fileText += "\t\twindow.require.config = window.require.config || {};\n";

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

                                // baseConfig
                                if (typeof baseConfig == "function") {
                                    var ret = baseConfig({
                                        name: pkg.name,
                                        package: pkg.name + "/main",
                                        library: library.name,
                                        sourcePath: path.resolve(process.cwd(), srcPath, pkg.name),
                                        compiledPath: path.resolve(process.cwd(), pathRel, pkg.name)
                                    });

                                    if (typeof ret != "undefined" && ret != null) {
                                        packageConfig[pkg.name + "/main"] = ret;
                                    }
                                }

                                if (pkg.hasOwnProperty("config")) {
                                    if (typeof packageConfig[pkg.name + "/main"] != "undefined") {
                                        module.smartMerge(packageConfig[pkg.name + "/main"], pkg.config);
                                    } else {
                                        packageConfig[pkg.name + "/main"] = pkg.config;
                                    }
                                }
                            });
                        }
                    }
                });

                if (deps.length > 0) {
                    fileText += '\t\twindow.require.deps = (window.require.deps || []).concat(["' + deps.join('","') + '"]);\n';
                }
            }

            // Parse packages for configs
            if (grunt.util.kindOf(this.environment.packages) == "array" && this.environment.packages.length > 0) {
                this.environment.packages.forEach(function (pkg) {
                    if (pkg && pkg.name) {
                        packages.push(pkg.name);

                        // baseConfig
                        if (typeof baseConfig == "function") {
                            var ret = baseConfig({
                                name: pkg.name,
                                package: pkg.name + "/main",
                                library: library.name,
                                sourcePath: path.resolve(process.cwd(), srcPath, pkg.name),
                                compiledPath: path.resolve(process.cwd(), pathRel, pkg.name)
                            });

                            if (ret) {
                                packageConfig[pkg.name + "/main"] = ret;
                            }
                        }

                        if (pkg.config) {
                            if (typeof packageConfig[pkg.name + "/main"] != "undefined") {
                                module.smartMerge(packageConfig[pkg.name + "/main"], pkg.config);
                            } else {
                                packageConfig[pkg.name + "/main"] = pkg.config;
                            }
                        }
                    } else {
                        grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                    }
                });
            }

            if (deps.concat(packages).length > 0) {
                fileText += '\t\twindow.require.packages = (window.require.packages || []).concat(["' + deps.concat(packages).join('","') + '"]);\n';
            }

            // asd

            for (var index in packageConfig) {
                fileText += '\t\twindow.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]) + ";\n";
            }

            if (grunt.util.kindOf(this.environment.base) == "object") {
                fileText += "\t\twindow.require.paths = window.require.paths || {};\n";
                for (var lib in this.environment.base) {
                    if (lib != "require") {
                        fileText += '\t\twindow.require.paths["' + lib + '"] = "' + path.normalize(pathToLib + this.environment.base[lib]).replace(/\\/g, "/") + '";\n';
                    }
                }
            }

            configuration.packageConfig = packageConfig;

            return fileText;
        },
        generateReplaces: function () {
            var replaces = {};

            // Replaces
            if (grunt.util.kindOf(this.environment.libraries) == "array") {
                this.environment.libraries.forEach(function (library) {
                    library.packages.include.forEach(function (pkg) {
                        if (typeof pkg == "object" && pkg.hasOwnProperty("name")) {
                            if (pkg.hasOwnProperty("replace")) {
                                replaces = module.mergeObjects(replaces, pkg.replace);
                            }
                        }
                    });
                });
            }

            if (grunt.util.kindOf(this.environment.packages) == "array") {
                this.environment.packages.forEach(function (pkg) {
                    if (typeof pkg == "object" && pkg.hasOwnProperty("name")) {
                        if (pkg.hasOwnProperty("replace")) {
                            replaces = module.mergeObjects(replaces, pkg.replace);
                        }
                    }
                });
            }

            if (Object.keys(replaces).length > 0) {
                var fileText = 'window.require = window.require || {};\n';
                fileText += '\t\t\twindow.require.map = window.require.map || {};\n';
                fileText += '\t\t\twindow.require.map["*"] = window.require.map["*"] || {};\n';

                for (var key in replaces) {
                    fileText += '\t\t\twindow.require.map["*"]["' + key + '"] = "../../target/compiled/' + key + '";\n';
                }
                return fileText;
            }
            return "";
        },
        generateAppNoCache: function (destPath) {
            var appJs = destPath + path.sep + "app.nocache.js";
            if (!grunt.file.exists(appJs)) {
                grunt.file.write(appJs, "__bootstrap();");
            }
        },
        generateBootstrap: function (srcPath, destPath) {
            var bootstrap = path.resolve(destPath, "bootstrap.js");
            var defBootstrap = path.resolve(__dirname, "config/bootstrap.js");

            var fileText = "var script = ('currentScript' in document) ? document.currentScript : document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1];\n";
            fileText += "var rootDir = Array(document.location.href.split(/[\/\\\\]/).filter(function(e, i){return script.src.split(/[\/\\\\]/)[i] !== e;}).length).join('../');\n";

            var compFile = grunt.file.read(defBootstrap);
            compFile = compFile.replace(/\{compiled}/g, this.generateConfigFile(srcPath, destPath));
            compFile = compFile.replace(/\{replaces}/g, this.generateReplaces());
            compFile = compFile.replace(/\{path_kelper_module}/g, path.relative(process.cwd(), this.modulePath + "/node_modules") + path.sep);
            compFile = compFile.replace(/\{path_kelper_include}/g, path.relative(process.cwd(), this.modulePath + "/include") + path.sep);

            compFile = compFile.replace(/\{path_compiled}/g, path.relative(process.cwd(), destPath) + path.sep);

            var optimization = require("../optimization/main").init(grunt).getConfiguration();
            compFile = compFile.replace(/\{path_optimized}/g, path.relative(process.cwd(), optimization.default.options.dir) + path.sep);
            var finalized = require("../finalization/main").init(grunt).getConfiguration();
            compFile = compFile.replace(/\{path_finalized}/g, path.relative(process.cwd(), finalized.target) + path.sep);

            // Fix slashes
            compFile = compFile.replace(/\\/g, "/");

            fileText += compFile;
            grunt.file.write(bootstrap, fileText);
        }
    });

    return module;
}