//External modules
var path = require('path');
var util = require("util");
var crypt = require("crypto");
var fs = require('fs');

// Module Compile
exports.init = function(grunt){
    var configuration = {};
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    grunt.registerTask('hashconstruction', 'Build task', function(){
        if(typeof module.environment.hash != "undefined"){
            configuration.hash = module.environment.hash;
            if(crypt.getHashes().indexOf(configuration.hash) < 0){
                grunt.fail.fatal("[ERROR] There is no '" + configuration.hash + "' method");
            }
        }

        if(module.generateAppNoCache()){
            grunt.log.ok("Files are hashed");
        }
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function(){

            // Load default configuration of Hash contructor
            if(grunt.file.exists(__dirname + path.sep + "config" + path.sep + "default.json")){
                try{
                    configuration = grunt.file.readJSON(__dirname + path.sep + "config" + path.sep + "default.json");
                    grunt.log.debug(this.name + " plugin default configuration is loaded!");
                }catch(ex){
                    grunt.log.error("[ERROR] " + this.name + " plugin default configuration has error!");
                    configuration = {};
                }
            }

            // Load Finalization module default configuration
            if(grunt.file.exists(this.modulePath + path.sep + "tasks" + path.sep + "modules" + path.sep + "finalization" + path.sep + "config" + path.sep + "default.json")){
                try{
                    var config = grunt.file.readJSON(this.modulePath + path.sep + "tasks" + path.sep + "modules" + path.sep + "finalization" + path.sep + "config" + path.sep + "default.json");
                    configuration = this.mergeObjects(configuration, config);

                    grunt.log.debug(this.name + " has loaded finalization plugin default configuration!");
                }catch(ex){}
            }

            // Load user created configuration
            if(grunt.file.exists(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + "finalization.js")){
                var config = require(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + "finalization.js")(grunt);

                configuration = this.mergeObjects(configuration, config);
            }else{
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            grunt.tasks(["hashconstruction"]);
        },
        makeLibraries: function(){
            var libraries = {};

            // Make Libraries
            if(grunt.util.kindOf(this.environment.libraries) == "array"){
                this.environment.libraries.forEach(function(library){
                    if(typeof library == "object" && library.hasOwnProperty("name")){
                        var hash = crypt.createHash(configuration.hash);
                        hash.update(fs.readFileSync(process.cwd() + path.sep + configuration.target + path.sep + library.name + path.sep + "/main.js"));
                        libraries[library.name] = hash.digest("hex");
                        fs.renameSync(process.cwd() + path.sep + configuration.target + path.sep + library.name + path.sep + "main.js", process.cwd() + path.sep + configuration.target + path.sep + library.name + path.sep + libraries[library.name] + ".js")
                    }else{
                        grunt.log.error("[ERROR] Unknown format of environment library, please fix it");
                    }
                });
            }

            // Make Packages
            if(grunt.util.kindOf(this.environment.packages) == "array"){
                this.environment.packages.forEach(function(pkg){
                    if(typeof pkg == "object" && pkg.hasOwnProperty("name")){
                        var hash = crypt.createHash(configuration.hash);
                        hash.update(fs.readFileSync(process.cwd() + path.sep + configuration.target + path.sep + pkg.name + path.sep + "/main.js"));
                        libraries[pkg.name] = hash.digest("hex");
                        fs.renameSync(process.cwd() + path.sep + configuration.target + path.sep + pkg.name + path.sep + "main.js", process.cwd() + path.sep + configuration.target + path.sep + pkg.name + path.sep + libraries[pkg.name] + ".js")
                    }else{
                        grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                    }
                });
            }

            return libraries;
        },
        makeLibs: function(){
            var hash = crypt.createHash(configuration.hash);
            hash.update(fs.readFileSync(process.cwd() + path.sep + configuration.target + path.sep + "base" + path.sep + "/main.js"));
            hash = hash.digest("hex");
            fs.renameSync(process.cwd() + path.sep + configuration.target + path.sep + "base" + path.sep + "main.js", process.cwd() + path.sep + configuration.target + path.sep + "base" + path.sep + hash + ".js");
            return hash;
        },
        generateAppNoCache: function(){
            var libraries = this.makeLibraries();
            var libs = this.makeLibs();

            // Gettings path
            var filePath = process.cwd() + path.sep + path.normalize(configuration.target) + path.sep + "app.nocache.js";
            var fileText = "window.require = window.require || {};\n";

            var libPackages = [];
            var staticPackages = [];
            var packageConfig = [];

            // Parse Libraries
            if(grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0){
                this.environment.libraries.forEach(function(library){
                    libPackages.push({
                        name: library.name,
                        main: libraries[library.name]
                    });

                    if(grunt.util.kindOf(library.packages) == "array" && library.packages.length > 0){
                        library.packages.forEach(function(pkg){
                            if(pkg.hasOwnProperty("config")){
                                packageConfig.push({
                                    name: pkg.name + "/main",
                                    config: pkg.config
                                });
                            }
                        });
                    }
                });
            }

            // Parse packages
            if(grunt.util.kindOf(this.environment.packages) == "array" && this.environment.packages.length > 0){
                this.environment.packages.forEach(function(pkg){
                    staticPackages.push({
                        name: pkg.name,
                        main: libraries[pkg.name]
                    });

                    if(pkg.hasOwnProperty("config")){
                        packageConfig.push({
                            name: pkg.name + "/main",
                            config: pkg.config
                        });
                    }
                });
            }

            if(libPackages.length > 0){
                var deps = libPackages.map(function(pkg){
                    return pkg.name;
                });

                fileText += 'window.require.deps = (window.require.deps || []).concat(["' + deps.join('","') + '"]);\n';
            }

            var packages = libPackages.concat(staticPackages);
            if(packages.length > 0){
                fileText += 'window.require.packages = (window.require.packages || []).concat(' + JSON.stringify(packages) + ');\n';
            }

            if(packageConfig.length > 0){
                fileText += "window.require.config = window.require.config || {};\n";
                packageConfig.forEach(function(config){
                    fileText += 'window.require.config["' + config.name + '"] = ' + JSON.stringify(config.config) + ";\n";
                });
            }

            fileText += "function __bootstrap(){\n";
            fileText += "   document.write(\"<script src='base/" + libs + ".js' defer='defer'></script>\");\n";
            fileText += "}\n";
            fileText += grunt.file.read(process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + "app.nocache.js");

            grunt.file.write(filePath, fileText);

            return true;
        }
    });

    return module;
};