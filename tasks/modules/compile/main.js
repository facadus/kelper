//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function(grunt){
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);
    var configuration = {};

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
            this.loadPlugin("grunt-typescript");
            grunt.config.set("typescript", configuration);

            this.generateLibraries(configuration.base.dest);
            this.generateAppNoCache(configuration.base.dest);
            this.generateConfigFile(configuration.base.dest);

            grunt.task.run("typescript");
        },
        parse: function(configuration){

            var parsed = {};

            // Parsing
            if(configuration.hasOwnProperty("source")){
                parsed.src = process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + "**" + path.sep + "*.ts";
            }
            if(configuration.hasOwnProperty("target")){
                parsed.dest = process.cwd() + path.sep + path.normalize(configuration.target);
            }
            if(configuration.hasOwnProperty("version")){
                if(parsed.hasOwnProperty("options")){
                    parsed.options.target = configuration.version;
                }else{
                    parsed.options = {target: configuration.version};
                }
            }

            // Fix for TypeScript
            return {
                base: parsed
            };
        },
        generateLibraries: function(dest){
            if(grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0){

                this.environment.libraries.forEach(function(library){
                    var fileText = 'define("' + library.name + '"';
                    if(grunt.util.kindOf(library.packages) == "array" && library.packages.length > 0){
                        var packages = [];
                        library.packages.forEach(function(pkg){
                            packages.push(pkg.name);
                        });
                        fileText += ', ["' + packages.join('","') + '"]';
                    }
                    fileText += ", function(){});";
                    grunt.file.write(dest + path.sep + library.name + path.sep + "main.js", fileText);
                });

            }
        },
        generateConfigFile: function(destPath){

            var configFile = destPath + path.sep + "config.js";
            var pathRel = path.relative(process.cwd(), configuration.base.dest).replace(/\\/g, "/");

            var fileText = "var rootDir = Array(document.location.href.split(/[\/\\\\]/).filter(function(e, i){return document.currentScript.src.split(/[\/\\\\]/)[i] !== e;}).length).join('../');\n";
            fileText += "window.require = window.require || {};\n";
            fileText += "window.require.baseUrl = rootDir + '" + pathRel + "';\n";

            var libraries = [];
            var packages = [];
            var packageConfig = {};

            // Parse Libraries
            if(grunt.util.kindOf(this.environment.libraries) == "array" && this.environment.libraries.length > 0){
                fileText += "window.require.config = window.require.config || {};\n";

                this.environment.libraries.forEach(function(library){
                    libraries.push(library.name);
                    if(grunt.util.kindOf(library.packages) == "array" && library.packages.length > 0){
                        library.packages.forEach(function(pkg){
                            packages.push(pkg.name);
                            if(pkg.hasOwnProperty("config")){
                                packageConfig[pkg.name + "/main"] = pkg.config;
                            }
                        });
                    }
                });

                if(libraries.length > 0){
                    fileText += 'window.require.deps = (window.require.deps || []).concat(["' + libraries.join('","') + '"]);\n';
                }
            }

            // Parse packages for configs
            if(grunt.util.kindOf(this.environment.packages) == "array" && this.environment.packages.length > 0){
                this.environment.packages.forEach(function(pkg){
                    if(typeof pkg == "object" && pkg.hasOwnProperty("name")){
                        packages.push(pkg.name);
                        if(pkg.hasOwnProperty("config")){
                            packageConfig[pkg.name + "/main"] = pkg.config;
                        }
                    }else{
                        grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                    }
                });
            }

            if(libraries.concat(packages).length > 0){
                fileText += 'window.require.packages = (window.require.packages || []).concat(["' + libraries.concat(packages).join('","') + '"]);\n';
            }

            for(var index in packageConfig){
                fileText += 'window.require.config["' + index + '"] = ' + JSON.stringify(packageConfig[index]) + ";\n";
            }

            if(grunt.util.kindOf(this.environment.base) == "object"){
                fileText += "window.require.paths = window.require.paths || {};\n";
                for(var lib in this.environment.base){
                    fileText += 'window.require.paths["' + lib + '"] = rootDir + "' + path.normalize(this.environment.base[lib]).replace(/\\/g, "/") + '";\n';
                }
            }

            grunt.file.write(configFile, fileText);
        },
        generateAppNoCache: function(destPath){
            var appJs = destPath + path.sep + "app.nocache.js";
            if(!grunt.file.exists(appJs)){
                grunt.file.write(appJs, "__bootstrap();");
            }
        }
    });

    return module;
};