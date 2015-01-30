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

            if(module.generateAppNoCache()){
                grunt.log.ok("Files are hashed");
            }
        }
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function(){

            // Load default configuration
            if(grunt.file.exists(__dirname + path.sep + "config" + path.sep + "default.json")){
                try{
                    configuration = grunt.file.readJSON(__dirname + path.sep + "config" + path.sep + "default.json");
                    grunt.log.debug(this.name + " plugin default configuration is loaded!");
                }catch(ex){
                    grunt.log.error("[ERROR] " + this.name + " plugin default configuration has error!");
                    configuration = {};
                }
            }

            // Load user created configuration
            if(grunt.file.exists(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + "finalization.js")){
                var config = require(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + "finalization.js")(grunt);
            }else{
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            configuration = this.mergeObjects(configuration, config);

            grunt.task.run("hashconstruction");
        },
        makeLibraries: function(){
            var libraries = {};

            this.environment.libraries.forEach(function(library){
                var hash = crypt.createHash(configuration.hash);
                hash.update(fs.readFileSync(process.cwd() + path.sep + configuration.target + path.sep + library.name + path.sep + "/main.js"));
                libraries[library.name] = hash.digest("hex");
                fs.renameSync(process.cwd() + path.sep + configuration.target + path.sep + library.name + path.sep + "main.js", process.cwd() + path.sep + configuration.target + path.sep + library.name + path.sep + libraries[library.name] + ".js")
            });

            return libraries;
        },
        makeLibs: function(){
            var hash = crypt.createHash(configuration.hash);
            hash.update(fs.readFileSync(process.cwd() + path.sep + configuration.target + path.sep + "base" + path.sep + "/main.js"));
            hash = hash.digest("hex");
            fs.renameSync(process.cwd() + path.sep + configuration.target + path.sep + "base" + path.sep + "main.js", process.cwd() + path.sep + configuration.target + path.sep + "base" + path.sep + hash + ".js")
            return hash;
        },
        generateAppNoCache: function(){
            var libraries = this.makeLibraries();
            var libs = this.makeLibs();

            // Gettings path
            var filePath = process.cwd() + path.sep + path.normalize(configuration.target) + path.sep + "app.nocache.js";

            var fileText = grunt.file.read(process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + "app.nocache.js");
            fileText += "window.require = window.require || {};\n";

            if(grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0){
                fileText += "window.require.config = window.require.config || {};\n";

                var packages = [];
                var packageConfig = {};

                this.environment.libraries.forEach(function(library){
                    packages.push({
                        name: library.name,
                        main: libraries[library.name]
                    });

                    if(grunt.util.kindOf(library.packages) == "array" && library.packages.length > 0){
                        library.packages.forEach(function(package){
                            if(package.hasOwnProperty("config")){
                                packageConfig[package.name + "/main"] = package.config;
                            }
                        });
                    }
                });

                if(packages.length > 0){
                    var deps = packages.map(function(pkg){
                        return pkg.name;
                    });

                    fileText += 'window.require.deps = (window.require.deps || []).concat(["' + deps.join('","') + '"]);\n';
                    fileText += 'window.require.packages = (window.require.packages || []).concat(["' + JSON.stringify(packages) + '"]);\n';
                }

                for(var index in packageConfig){
                    fileText += 'window.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]) + ";\n";
                }
            }

            grunt.file.write(filePath, fileText);

            return true;
        },
        generateConfigFile: function(destPath){

            var configFile = destPath + path.sep + "config.js";


            // ToDo:
            //   Need to test this function (SelfMaded) - WebStorm - ok

            if(grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0){
                fileText += "window.require.config = window.require.config || {};\n";

                var libraries = [];
                var packages = [];
                var packageConfig = {};

                this.environment.libraries.forEach(function(library){
                    libraries.push(library.name);
                    if(grunt.util.kindOf(library.packages) == "array" && library.packages.length > 0){
                        library.packages.forEach(function(package){
                            packages.push(package.name);
                            if(package.hasOwnProperty("config")){
                                packageConfig[package.name + "/main"] = package.config;
                            }
                        });
                    }
                });

                if(libraries.length > 0){
                    fileText += 'window.require.deps = (window.require.deps || []).concat(["' + libraries.join('","') + '"]);\n';
                    fileText += 'window.require.packages = (window.require.packages || []).concat(["' + libraries.concat(packages).join('","') + '"]);\n';
                }

                for(var index in packageConfig){
                    fileText += 'window.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]) + ";\n";
                }
            }

            if(grunt.util.kindOf(this.environment.base) == "object"){
                fileText += "window.require.paths = window.require.paths || {};\n";
                for(var lib in this.environment.base){
                    fileText += 'window.require.paths["' + lib + '"] = rootDir + "' + path.normalize(this.environment.base[lib]).replace(/\\/g, "/") + '";\n';
                }
            }

            grunt.file.write(configFile, fileText);
        }
    });

    return module;
};