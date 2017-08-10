//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function (grunt) {
    'use strict';

    var module = require(path.join(path.dirname(__dirname), "default")).init(grunt);
    var deps = require("./include/depsAdder").init(grunt);

    var configuration = {};
    var moduleIncludes = {};

    module.registerTask("addDependencies", "Adding dependencies to files", function () {
        var depsPath = path.resolve(process.cwd(), configuration.default.options.baseUrl);
        // Get Modules with dependencies
        deps.addFoundDependenciesToFiles(depsPath);
    });

    module.registerTask("replaceDependencies", "Replacing dependencies to files", function () {
        // Load library
        var deps = require("./include/depsReplacer").init(grunt);
        var depsPath = path.resolve(process.cwd(), configuration.default.options.baseUrl);
        // Get Modules with dependencies
        deps.replaceDependencies();
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {
            this.getConfiguration();

            // Load library
            deps.findDependencies(module.environment);
            moduleIncludes = deps.getIncludes(this.lastConfigurations.compile.default.sourcePath);

            this.runTask("addDependencies", {default: {}}, []);

            if (this.isNotEmptyObject(this.environment.libraries)) {
                configuration.default.options = this.mergeObjects(configuration.default.options, this.parseLibraries(this.environment.libraries));
            }

            if (this.isNotEmptyObject(this.environment.reqModules) || this.isNotEmptyObject(this.lastConfigurations.compile.default.jsMapping)) {
                this.smartMerge(configuration.default.options, this.parseRequireModules(this.environment.reqModules, this.lastConfigurations.compile.default.jsMapping));
            }

            if (this.isNotEmptyObject(this.environment.packages)) {
                this.parsePackages(this.environment.packages, configuration.default.options.packages);
            }

            if (this.isNotEmptyObject(this.environment.base)) {
                configuration.default.options = this.mergeObjects(configuration.default.options, this.parseBaseLibs(this.environment.base));
            }

            if (this.isNotEmptyObject(this.environment.shim)) {
                configuration.default.options = this.mergeObjects(configuration.default.options, this.parseShim(this.environment.shim));
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

                    var reqModules = [];
                    for (var reqMod in module.environment.reqModules) {
                        reqModules.push(
                            module.environment.reqModules[reqMod].replace("{path.fromRoot}", process.cwd().replace(/\\/g, "/"))
                        );
                    }

                    bundles.bundles.forEach(function (bundle) {
                        var parent = path.relative(
                            path.resolve(process.cwd(), configuration.default.options.dir),
                            bundle.parent.substr(0, bundle.parent.lastIndexOf('/main')) || bundle.parent
                        );

                        output[parent] = bundle.children.map(function (bnd) {
                            if (/^[\w]+!/.test(bnd)) {
                                return bnd;
                            } else {
                                if (reqModules.indexOf((bnd.substr(0, bnd.lastIndexOf('.')) || bnd).replace(/\\/g, "/")) > -1) {
                                    return false;
                                }

                                return path.relative(
                                    path.resolve(process.cwd(), configuration.default.options.baseUrl),
                                    (bnd.substr(0, bnd.lastIndexOf('.')) || bnd).replace(/\\/g, "/")
                                ).replace(/\\/g, "/");
                            }
                        });
                    });
                }
                module.configuration.bundles = module.mergeObjects(module.configuration.bundles || {}, output);
                done();
            };

            var newConfig = grunt.util._.clone(configuration);
            if (grunt.util.kindOf(configuration.default.options.modules) == "array" && configuration.default.options.modules.length > 0) {
                for (var i = 0; i < configuration.default.options.modules.length; i++) {
                    var optModule = grunt.util._.clone(configuration.default.options.modules[i], true);
                    newConfig[optModule.name] = grunt.util._.clone(configuration.default, true);

                    if (this.isNotEmptyObject(this.lastConfigurations.compile.packageConfig)) {
                        newConfig[optModule.name].options.config = this.lastConfigurations.compile.packageConfig;
                    }
                    
                    var excludes = [];
                    if (optModule.exclude && optModule.exclude.length > 0) {
                        optModule.exclude.forEach(function (mdl) {
                            newConfig[optModule.name].options.paths[mdl] = "empty:";
                        });
                    }

                    for(var mInc in moduleIncludes){
                        if(optModule.include.indexOf(mInc) > -1){
                            optModule.include = optModule.include.concat(moduleIncludes[mInc]);
                        }
                    }

                    this.smartMerge(newConfig[optModule.name].options, {
                        name: optModule.name,
                        include: optModule.include,
                        exclude: excludes,
                        out: path.resolve(newConfig[optModule.name].options.dir, optModule.name, "main.js"),
                        requireDeps: optModule.insertRequire,
                        create: true
                    });

                    this.parseConfigs(newConfig[optModule.name]);

                    grunt.file.mkdir(
                        path.resolve(newConfig[optModule.name].options.dir, optModule.name)
                    );

                    delete newConfig[optModule.name].options.modules;
                    delete newConfig[optModule.name].options.dir;
                }
                delete newConfig["default"].options.modules;
            }

            this.configuration = configuration;

            // Setting configuration
            this.loadPlugin("grunt-contrib-requirejs");

            if (Object.keys(newConfig).length > 1) {
                var tasks = this.runTask("requirejs", newConfig, Object.keys(newConfig));
                this.runTask("replaceDependencies", newConfig, Object.keys(newConfig));
                return tasks;
            }

            return this.runTask("requirejs", newConfig);
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
            var userFile = grunt.config.get("kelper");
            if (userFile && userFile[this.name] && typeof userFile[this.name] == "function") {
                var config = (userFile[this.name])();
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

            var skipPaths = {};
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

                            if (pkg != null) {
                                if (typeof pkg == "boolean") {
                                    excludes.push(packageName);
                                } else {
                                    if (pkg.skip) {
                                        skipPaths[packageName] = 'empty:';
                                    }
                                    includes.push(packageName);

                                    if (!pkg.skipRequire) {
                                        includeRequire.push(
                                            pkg.requireName ? pkg.requireName : packageName
                                        );
                                    }

                                    if (pkg.replace) {
                                        parsed.paths = this.mergeObjects(parsed.paths, pkg.replace);
                                    }
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

            parsed.paths = this.mergeObjects(parsed.paths, skipPaths);

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
        parseRequireModules: function (reqModules, jsMapping) {
            var paths = {};
            var srcPath = path.resolve(process.cwd(), this.lastConfigurations.compile.default.sourcePath) + path.sep;

            if (this.isNotEmptyObject(reqModules)) {
                for (var lib in reqModules) {
                    var reqModulePath = reqModules[lib]
                        .replace("{path.fromKelper}", this.modulePath)
                        .replace("{path.fromSource}", path.resolve(process.cwd(), this.lastConfigurations.compile.default.sourcePath))
                        .replace("{path.fromRoot}", process.cwd());
                    paths[lib] = path.normalize(reqModulePath);
                }
            }

            var ret = grunt.util._.clone(paths);
            if (this.isNotEmptyObject(jsMapping)) {
                if (jsMapping.files && jsMapping.files.length > 0) {
                    jsMapping.files.forEach(function (map) {
                        var files = grunt.file.expand(path.resolve(srcPath, map));
                        files.forEach(function (file) {
                            var fileMap = path.relative(
                                srcPath,
                                file.replace(/\.js$/i, "")
                            ).replace(/\\/g, "/");
                            paths[fileMap] = path.resolve(srcPath, fileMap).replace(/\\/g, "/");
                        });
                    });
                }
            }

            return {
                paths: paths,
                stubModules: Object.keys(ret),
                sourceDir: srcPath
            }
        },
        parseShim: function (shims) {
            return {
                shim: shims
            }
        },
        parseConfigs: function (config) {
            var paths = config.options.paths || {};
            var excludePaths = [];

            // Filter excluded paths
            for (var path in paths) {
                if (paths[path] == "empty:") {
                    excludePaths.push(path);
                }
            }

            // Get paths to remove
            for (var path in paths) {
                if (paths[path] !== "empty:") {
                    excludePaths.forEach(function (exclPath) {
                        var regEx = new RegExp("^" + exclPath, "i");
                        if (regEx.test(path)) {
                            delete paths[path];
                        }
                    });
                }
            }

            return paths;
        },
        createModule: function (fileName, dest, modules) {
            var fileText = 'define("' + dest + '", ["' + modules.join('","') + '"], function(){});';
            grunt.file.write(fileName, fileText);
        }
    });

    return module;
};
