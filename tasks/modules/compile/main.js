//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function(grunt){
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    util._extend(module, {
        name: path.basename(__dirname),
        run: function(){
            var configuration = {};

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
            if(grunt.file.exists(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + this.name + ".js")){
                var config = require(process.cwd() + path.sep + "config" + path.sep + "build" + path.sep + this.name + ".js")(grunt);

                //Parsing configuration
                configuration = this.mergeObjects(configuration, this.parse(config));
            }else{
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            if(typeof configuration.base != "undefined" && configuration.base.dest != "undefined"){
                this.makeClear(configuration.base.dest);
            }

            // For Debug ->
            grunt.log.debug(JSON.stringify(configuration));

            // Setting configuration
            grunt.config.set("typescript", configuration);
            this.loadPlugin("grunt-typescript");

            this.generateLibraries(configuration.base.dest);
            this.generateConfigFile(configuration.base.dest);

            grunt.task.run("typescript");
        },
        parse: function(configuration){
            // Parsing
            if(configuration.hasOwnProperty("source")){
                configuration.src = process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + "**" + path.sep + "*.ts";
                delete configuration.source;
            }
            if(configuration.hasOwnProperty("target")){
                configuration.dest = process.cwd() + path.sep + path.normalize(configuration.target);
                delete configuration.target;
            }
            if(configuration.hasOwnProperty("version")){
                if(configuration.hasOwnProperty("options")){
                    configuration.options.target = configuration.version;
                }else{
                    configuration.options = {target: configuration.version};
                }
                delete configuration.version;
            }

            // Fix for TypeScript
            return {
                base: configuration
            };
        },
        generateLibraries: function(dest){
            if(grunt.util.kindOf(this.environment.libraries) == "array"){

                this.environment.libraries.forEach(function(library){
                    var fileText = 'define("' + library.name + '"';
                    if(grunt.util.kindOf(library.packages) == "array" && library.packages.length > 0){
                        var packages = [];
                        library.packages.forEach(function(package){
                            packages.push(package.name);
                        });
                        fileText += ', ["' + packages.join('","') + '"]';
                    }
                    fileText += ", function(){});";
                    grunt.file.write(dest + path.sep + library.name + path.sep + "main.js", fileText);
                });

            }
        },
        generateConfigFile: function(destPath){
            var fileText = "";
            var configFile = destPath + path.sep + "config.js";

            if(grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0){
                fileText += "window.require = window.require || {};\r\n";
                fileText += "window.require.config = window.require.config || {};\r\n";

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

                fileText += 'window.require.deps = ["' + libraries.join('","') + '"];\r\n';
                fileText += 'window.require.packages = ["' + libraries.concat(packages).join('","') + '"];\r\n';

                for(var index in packageConfig){
                    fileText += 'window.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]);
                }
            }

            grunt.file.write(configFile, fileText);
        }
    });

    return module;
};