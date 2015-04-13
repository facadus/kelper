//External modules
var path = require('path');
var util = require("util");
var crypt = require("crypto");
var fs = require('fs');
var EoL = require("os").EOL;

// Module Compile
exports.init = function (grunt) {
    'use strict';

    var module = require(path.join(path.dirname(__dirname), "default")).init(grunt);
    var configuration = {};

    module.registerTask('hashconstruction', 'Build task', function () {
        if (typeof module.environment.hash != "undefined") {
            configuration.hash = module.environment.hash;
            if (crypt.getHashes().indexOf(configuration.hash) < 0) {
                grunt.fail.fatal("[ERROR] There is no '" + configuration.hash + "' method");
            }
        }

        module.configuration.libraries = module.generateAppNoCache();
        if (module.configuration.libraries && !grunt.test) {
            grunt.log.ok("Files are hashed");
        }
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {
            this.getConfiguration();

            this.configuration = configuration;
            configuration = this.mergeObjects(configuration, this.lastConfigurations.finalization);

            return this.runTask("hashconstruction", {default: {}}, []);
        },
        getConfiguration: function () {
            // Load default configuration of Hash contructor
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

            return configuration;
        },
        setConfiguration: function (conf) {
            configuration = conf;
        },
        makeLibraries: function () {
            var libraries = {};

            // Make Libraries
            if (this.isNotEmptyObject(this.environment.libraries)) {
                for (var libraryName in this.environment.libraries) {
                    var library = this.environment.libraries[libraryName];

                    if (library) {
                        var libraryPath = path.resolve(process.cwd(), configuration.target, libraryName, "main.js");
                        var hash = crypt.createHash(configuration.hash);
                        hash.update(fs.readFileSync(libraryPath));
                        libraries[libraryName] = hash.digest("hex");
                        fs.renameSync(
                            libraryPath,
                            path.resolve(process.cwd(), configuration.target, libraryName, libraries[libraryName] + ".js")
                        );
                    }
                }
            }

            // Make Packages
            if (this.isNotEmptyObject(this.environment.packages)) {
                for (var packageName in this.environment.packages) {
                    if (this.environment.packages[packageName]) {
                        var packagePath = path.resolve(process.cwd(), configuration.target, packageName, "main.js");
                        var hash = crypt.createHash(configuration.hash);
                        hash.update(fs.readFileSync(packagePath));
                        libraries[packageName] = hash.digest("hex");
                        fs.renameSync(
                            packagePath,
                            path.resolve(process.cwd(), configuration.target, packageName, libraries[packageName] + ".js")
                        );
                    }
                }
            }

            return libraries;
        },
        makeLibs: function () {
            var basePath = path.resolve(process.cwd(), configuration.target, "base/main.js");
            if (grunt.file.exists(basePath)) {
                var hash = crypt.createHash(configuration.hash);
                hash.update(fs.readFileSync(basePath));
                hash = hash.digest("hex");
                fs.renameSync(
                    basePath,
                    path.resolve(process.cwd(), configuration.target, "base", hash + ".js")
                );
                return hash;
            }
            return null;
        },
        generateAppNoCache: function (cdn) {
            if(cdn) {
                var libraries = cdn.libraries;
                var libs = cdn.libs;
            }else{
                var libraries = this.makeLibraries();
                var libs = this.makeLibs();
            }

            // Gettings path
            var filePath = path.resolve(process.cwd(), configuration.target, "app.nocache.js");
            var fileText = "window.require = window.require || {};" + EoL;

            var libPackages = [];
            var staticPackages = [];
            var packageConfig = this.lastConfigurations.compile.packageConfig;
            var deps = [];

            if (cdn) {
                fileText += 'window.baseUrl = "' + cdn.url + '";' + EoL;
            }

            // Parse Libraries
            if (this.isNotEmptyObject(this.environment.libraries)) {
                for (var libraryName in this.environment.libraries) {
                    var library = this.environment.libraries[libraryName];

                    if (library) {
                        libPackages.push({
                            name: libraryName,
                            main: libraries[libraryName]
                        });

                        if (library.autoStart) {
                            deps.push(library.requireName ? library.requireName : libraryName);
                        }

                        if (this.isNotEmptyObject(library.packages)) {
                            for (var packageName in library.packages) {
                                if (library.packages[packageName] && !library.autoStart) {
                                    libPackages.push({
                                        name: packageName
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Parse packages
            if (this.isNotEmptyObject(this.environment.packages)) {
                for (var packageName in this.environment.packages) {
                    staticPackages.push({
                        name: packageName,
                        main: libraries[packageName]
                    });
                }
            }

            // Deps
            if (deps.length > 0) {
                fileText += 'window.require.deps = (window.require.deps || []).concat(["' + deps.join('","') + '"]);' + EoL;
            }

            var packages = libPackages.concat(staticPackages);
            if (packages.length > 0) {
                fileText += 'window.require.packages = (window.require.packages || []).concat(' + JSON.stringify(packages) + ');' + EoL;
            }

            // Bundles
            if (this.lastConfigurations.optimization.hasOwnProperty("bundles")) {
                fileText += "window.require.bundles = window.require.bundles || {};" + EoL;
                for (var bundle in this.lastConfigurations.optimization.bundles) {
                    if (deps.indexOf(bundle) == -1) {
                        fileText += 'window.require.bundles["' + bundle + '"] = ' + JSON.stringify(this.lastConfigurations.optimization.bundles[bundle]) + ';' + EoL;
                    }
                }
            }

            if (Object.keys(packageConfig).length > 0) {
                fileText += "window.require.config = window.require.config || {};" + EoL;
                for (var index in packageConfig) {
                    fileText += 'window.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]) + ';' + EoL;
                }
            }

            // Copy shims if they exists
            if (this.isNotEmptyObject(this.environment.shim)) {
                fileText += "window.require.shim = window.require.shim || {};" + EoL;
                for (var shim in this.environment.shim) {
                    fileText += 'window.require.shim["' + shim + '"] = ' + JSON.stringify(this.environment.shim[shim]) + ';' + EoL;
                }
            }

            fileText += "function __bootstrap(){" + EoL;
            if (libs) {
                if (cdn) {
                    fileText += "   document.write(\"<script src='" + cdn.url + "base/" + libs + ".js' defer='defer'></script>\");" + EoL;
                } else {
                    fileText += "   document.write(\"<script src='base/" + libs + ".js' defer='defer'></script>\");" + EoL;
                }
            }
            fileText += "}" + EoL;
            fileText += grunt.file.read(
                path.resolve(process.cwd(), configuration.source, "app.nocache.js")
            );

            // Remove comments
            fileText = fileText.replace(/\s\/\/.*|\/\*([^\0]*?)\*\//gm, "");

            // Write to file
            grunt.file.write(filePath, fileText);

            if (typeof this.environment.uglify != "undefined") {
                this.minimize(filePath);
            }

            return {
                libraries: libraries,
                libs: libs
            };
        },
        minimize: function (file) {
            var options = this.mergeObjects({
                banner: '',
                footer: '',
                compress: {
                    warnings: false
                },
                mangle: {},
                beautify: false,
                report: 'min',
                expression: false,
                maxLineLen: 32000,
                ASCIIOnly: false
            }, this.lastConfigurations.finalization.uglify.options);

            var uglify = require(
                path.resolve(this.modulePath, "node_modules/grunt-contrib-uglify/tasks/lib/uglify")
            ).init(grunt);

            try {
                var minified = uglify.minify(
                    [file],
                    path.dirname(file),
                    options
                );
                grunt.file.write(file, minified.min);
            } catch (ex) {
                console.log("Failed to minimize " + file, ex);
                return false;
            }

            return true;
        }
    });

    return module;
};