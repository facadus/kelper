//External modules
var path = require('path');
var util = require("util");
var EoL = require("os").EOL;

// Module Compile
exports.init = function (grunt) {
    'use strict';

    var module = require(path.join(path.dirname(__dirname), "default")).init(grunt);

    var configuration = {};
    var baseConfig = null;
    var kindOf = grunt.util.kindOf;

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

            return this.runTask("typescript", {
                default: configuration.default
            });
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
                var config = require(userFile)(grunt, {
                    source: path.resolve(process.cwd(), configuration.default.sourcePath),
                    target: path.resolve(process.cwd(), configuration.default.dest)
                });

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
                parsed.sourcePath = path.resolve(process.cwd(), configuration.source);
                parsed.src = path.resolve(parsed.sourcePath, "**/*.ts");
                if (parsed.hasOwnProperty("options")) {
                    parsed.options.basePath = path.normalize(configuration.source);
                } else {
                    parsed.options = {
                        basePath: path.normalize(configuration.source)
                    }
                }
            }

            if (configuration.hasOwnProperty("target")) {
                parsed.dest = path.resolve(process.cwd(), configuration.target);
            }

            if (configuration.hasOwnProperty("version")) {
                if (parsed.hasOwnProperty("options")) {
                    parsed.options.target = configuration.version;
                } else {
                    parsed.options = {target: configuration.version};
                }
            }

            if (configuration.hasOwnProperty("jsMapping") && configuration.jsMapping && kindOf(configuration.jsMapping.files) == "array" && configuration.jsMapping.files.length) {
                parsed.jsMapping = configuration.jsMapping;
            }

            if (kindOf(configuration.baseConfig) == "function") {
                baseConfig = configuration.baseConfig;
            }

            // Fix for TypeScript
            return {
                default: parsed
            };
        },
        generateConfigFile: function (srcPath) {
            var pathRel = path.relative(process.cwd(), configuration.default.dest).replace(/\\/g, "/");
            var pathToLib = Array(pathRel.split(/[\/\\\\]/).length + 1).join("../");
            var relSourcePath = path.relative(process.cwd(), srcPath);

            var fileText = "window.require = window.require || {};" + EoL;
            fileText += "\t\twindow.require.baseUrl = rootDir + '" + pathRel + "';" + EoL;
            fileText += "\t\twindow.require.sourceDir = rootDir + '" + relSourcePath + "/';" + EoL;

            var deps = [];
            var packages = [];
            var packageConfig = {};
            var packageList = [];
            var moduleList = [];


            // Collect all library packages for baseConfig
            if (this.isNotEmptyObject(this.environment.libraries)) {
                for (var libraryName in this.environment.libraries) {
                    var library = this.environment.libraries[libraryName];

                    // Check each library and library name
                    if (library) {
                        if (this.isNotEmptyObject(library.packages)) {
                            for (var packageName in library.packages) {
                                var pkg = library.packages[packageName];
                                if (pkg) {
                                    packages.push(packageName);

                                    if (library.autoStart) {
                                        deps.push(pkg.requireName ? pkg.requireName : packageName);
                                    }

                                    packageList.push({
                                        packageName: packageName,
                                        libraryName: libraryName,
                                        sourcePath: path.resolve(process.cwd(), srcPath, packageName),
                                        compiledPath: path.resolve(process.cwd(), pathRel, packageName)
                                    });

                                    if (pkg.config) {
                                        for(var conf in pkg.config){
                                            moduleList.push({
                                                moduleName: packageName + "/" + conf,
                                                packageName: packageName,
                                                libraryName: libraryName,
                                                config: pkg.config[conf],
                                                sourcePath: path.resolve(process.cwd(), srcPath, packageName),
                                                compiledPath: path.resolve(process.cwd(), pathRel, packageName)
                                            });
                                            packageConfig[packageName + "/" + conf] = pkg.config[conf];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (deps.length > 0) {
                    fileText += '\t\twindow.require.deps = (window.require.deps || []).concat(["' + deps.join('","') + '"]);' + EoL;
                }
            }

            // Collect all library packages for baseConfig
            if (this.isNotEmptyObject(this.environment.packages)) {
                for (var packageName in this.environment.packages) {
                    if (this.environment.packages[packageName]) {
                        var pkg = this.environment.packages[packageName];
                        if (pkg) {
                            packages.push(packageName);

                            packageList.push({
                                packageName: packageName,
                                sourcePath: path.resolve(process.cwd(), srcPath, packageName),
                                compiledPath: path.resolve(process.cwd(), pathRel, packageName)
                            });

                            if (pkg.config) {
                                for(var conf in pkg.config){
                                    moduleList.push({
                                        moduleName: packageName + "/" + conf,
                                        packageName: packageName,
                                        config: pkg.config[conf],
                                        sourcePath: path.resolve(process.cwd(), srcPath, packageName),
                                        compiledPath: path.resolve(process.cwd(), pathRel, packageName)
                                    });
                                    packageConfig[packageName + "/" + conf] = pkg.config[conf];
                                }
                            }
                        }
                    }
                }
            }

            // Usage of baseConfig
            if (moduleList && moduleList.length) {
                if (typeof baseConfig == "function") {
                    var object = this;
                    moduleList.forEach(function (pkg) {
                        var ret = baseConfig(pkg, packageList);
                        if (ret) {
                            if (packageConfig[pkg.moduleName]) {
                                object.smartMerge(ret, packageConfig[pkg.moduleName]);
                            }
                            packageConfig[pkg.moduleName] = ret;
                        }
                    });
                }
            }

            if (deps.concat(packages).length > 0) {
                fileText += '\t\twindow.require.packages = (window.require.packages || []).concat(["' + deps.concat(packages).join('","') + '"]);' + EoL;
            }

            if (this.isNotEmptyObject(packageConfig)) {
                fileText += '\t\twindow.require.config = window.require.config || {};' + EoL;
                for (var index in packageConfig) {
                    fileText += '\t\twindow.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]) + ";" + EoL;
                }
            }

            if ((this.isNotEmptyObject(this.environment.base) && Object.keys(this.environment.base).length > 1) || this.isNotEmptyObject(this.environment.reqModules) || this.isNotEmptyObject(configuration.default.jsMapping)) {
                fileText += "\t\twindow.require.paths = window.require.paths || {};" + EoL;

                if (kindOf(this.environment.base) == "object") {
                    for (var lib in this.environment.base) {
                        if (lib != "require") {
                            fileText += '\t\twindow.require.paths["' + lib + '"] = "' + path.normalize(pathToLib + this.environment.base[lib]).replace(/\\/g, "/") + '";' + EoL;
                        }
                    }
                }

                if (kindOf(this.environment.reqModules) == "object") {
                    for (var lib in this.environment.reqModules) {
                        var reqModulePath = this.environment.reqModules[lib]
                            .replace("{path.fromKelper}", path.relative(
                                path.resolve(process.cwd(), pathRel),
                                this.modulePath
                            ))
                            .replace("{path.fromSource}", path.relative(
                                path.resolve(process.cwd(), pathRel),
                                path.resolve(process.cwd(), srcPath)
                            ))
                            .replace("{path.fromRoot}", path.relative(
                                path.resolve(process.cwd(), pathRel),
                                process.cwd()
                            ))
                            .replace(/\\/g, "/");
                        fileText += '\t\twindow.require.paths["' + lib + '"] = "' + reqModulePath + '";' + EoL;
                    }
                }

                if (kindOf(configuration.default.jsMapping) == "object") {
                    if (configuration.default.jsMapping.files && configuration.default.jsMapping.files.length > 0) {
                        var pathRelToSource = path.relative(process.cwd(), srcPath);
                        configuration.default.jsMapping.files.forEach(function (map) {
                            var files = grunt.file.expand(
                                path.resolve(process.cwd(), srcPath, map)
                            );
                            files.forEach(function (file) {
                                var fileMap = path.relative(
                                    path.resolve(process.cwd(), srcPath),
                                    file.replace(/\.js$/i, "")
                                ).replace(/\\/g, "/");
                                fileText += '\t\twindow.require.paths["' + fileMap + '"] = "' + path.join(pathToLib, pathRelToSource, fileMap).replace(/\\/g, "/") + '";' + EoL;
                            });
                        });
                    }
                }
            }

            // Copy shims if they exists
            if (this.isNotEmptyObject(this.environment.shim)) {
                fileText += "\t\twindow.require.shim = window.require.shim || {};" + EoL;
                for (var shim in this.environment.shim) {
                    fileText += '\t\twindow.require.shim["' + shim + '"] = ' + JSON.stringify(this.environment.shim[shim]) + ';' + EoL;
                }
            }

            configuration.packageConfig = packageConfig;

            return fileText;
        },
        generateReplaces: function () {
            var replaces = {};
            var pathRel = path.relative(process.cwd(), configuration.default.dest).replace(/\\/g, "/");
            var pathToLib = Array(pathRel.split(/[\/\\\\]/).length + 1).join("../");

            // Replaces
            if (this.isNotEmptyObject(this.environment.libraries)) {
                for (var libraryName in this.environment.libraries) {
                    var library = this.environment.libraries[libraryName];
                    if (library) {
                        if (this.isNotEmptyObject(library.packages)) {
                            for (var packageName in library.packages) {
                                var pkg = library.packages[packageName];

                                // Check package and package name
                                if (pkg) {
                                    if (pkg.replace) {
                                        replaces = this.mergeObjects(replaces, pkg.replace);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (this.isNotEmptyObject(this.environment.packages)) {
                for (var packageName in this.environment.packages) {
                    var pkg = this.environment.packages[packageName];

                    // Check package and package name
                    if (pkg) {
                        if (pkg.replace) {
                            replaces = this.mergeObjects(replaces, pkg.replace);
                        }
                    }
                }
            }

            if (Object.keys(replaces).length > 0) {
                var fileText = 'window.require = window.require || {};' + EoL;
                fileText += '\t\t\twindow.require.map = window.require.map || {};' + EoL;
                fileText += '\t\t\twindow.require.map["*"] = window.require.map["*"] || {};' + EoL;

                for (var key in replaces) {
                    var pathToCompiled = path.relative(
                        process.cwd(),
                        path.resolve(process.cwd(), pathToLib, configuration.default.dest, key)
                    );
                    fileText += '\t\t\twindow.require.map["*"]["' + key + '"] = "' + pathToCompiled + '";' + EoL;
                }

                return fileText;
            }
            return "";
        },
        generateAppNoCache: function (destPath) {
            var appJs = path.join(destPath, "app.nocache.js");
            if (!grunt.file.exists(appJs)) {
                grunt.file.write(appJs, "__bootstrap();");
            }
        },
        generateBootstrap: function (srcPath, destPath) {
            var bootstrap = path.resolve(destPath, "bootstrap.js");
            var defBootstrap = path.resolve(__dirname, "config/bootstrap.js");

            var fileText = "var script = ('currentScript' in document) ? document.currentScript : document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1];" + EoL;
            fileText += "var rootDir = Array(document.location.href.replace(document.location.hash,'').split(/[\/\\\\]/).filter(function(e, i){return script.src.split(/[\/\\\\]/)[i] !== e;}).length).join('../');" + EoL;

            var compFile = grunt.file.read(defBootstrap);
            compFile = compFile.replace(/\{compiled}/g, this.generateConfigFile(srcPath));
            compFile = compFile.replace(/\{replaces}/g, this.generateReplaces());
            compFile = compFile.replace(/\{path_kelper_module}/g, path.relative(process.cwd(), this.modulePath + "/node_modules") + path.sep);
            compFile = compFile.replace(/\{path_kelper_include}/g, path.relative(process.cwd(), this.modulePath + "/include") + path.sep);

            var reqJSpath = path.relative(process.cwd(), require.resolve("requirejs").substr(0, require.resolve("requirejs").lastIndexOf("requirejs") + "requirejs".length));
            var chaiJSpath = path.relative(process.cwd(), require.resolve("chai").substr(0, require.resolve("chai").lastIndexOf("chai") + "chai".length));
            var mochaJSpath = path.relative(process.cwd(), require.resolve("mocha").substr(0, require.resolve("mocha").lastIndexOf("mocha") + "mocha".length));

            compFile = compFile.replace(/\{path_requirejs}/g, reqJSpath + path.sep);
            compFile = compFile.replace(/\{path_chai}/g, chaiJSpath + path.sep);
            compFile = compFile.replace(/\{path_mocha}/g, mochaJSpath + path.sep);

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
};