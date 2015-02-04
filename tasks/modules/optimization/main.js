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

            this.checkTest();

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

            if(typeof this.environment.libraries != "undefined"){
                configuration.compile.options = this.mergeObjects(configuration.compile.options, this.parseLibraries(this.environment.libraries));
            }

            if(typeof this.environment.packages != "undefined"){
                this.parsePackages(this.environment.packages, configuration.compile.options.packages);
            }

            if(typeof this.environment.base != "undefined"){
                configuration.compile.options = this.mergeObjects(configuration.compile.options, this.parseBaseLibs(this.environment.base));
            }

            if(typeof configuration.compile != "undefined" && typeof configuration.compile.options.dir != "undefined"){
                this.makeClear(configuration.compile.options.dir);
            }

            // For Debug ->
            grunt.log.debug(JSON.stringify(configuration));

            // Setting configuration
            grunt.config.set("requirejs", configuration);

            this.loadPlugin("grunt-contrib-requirejs");
            grunt.tasks(["requirejs"]);
        },
        parse: function(configuration){

            var parsed = {};

            // Parsing
            if(configuration.hasOwnProperty("source")){
                parsed.baseUrl = process.cwd() + path.sep + path.normalize(configuration.source);
            }
            if(configuration.hasOwnProperty("target")){
                parsed.dir = process.cwd() + path.sep + path.normalize(configuration.target);
            }

            // Fix for RequireJS
            return {
                compile: {
                    options: parsed
                }
            };
        },
        parseLibraries: function(source){
            var parsed = {
                modules: [],
                packages: []
            };

            source.forEach(function(library){
                // Push Modules
                parsed.packages.push(library.name);
                parsed.modules.push({
                    name: library.name
                });

                // Push packages
                library.packages.forEach(function(pkg){
                    parsed.packages.push(pkg.name);
                });
            });

            return parsed;
        },
        parseBaseLibs: function(libs){
            var paths = {};
            for(var lib in libs){
                paths[lib] = "empty:";
            }
            return {paths: paths};
        },
        parsePackages: function(packages, confPackages){
            var parsed = confPackages || [];
            if(grunt.util.kindOf(packages) == "array"){
                packages.forEach(function(pkg){
                    if(typeof pkg == "object" && pkg.hasOwnProperty("name")){
                        parsed.push(pkg.name);
                    }
                });
            }
            confPackages = parsed;
        }
    });

    return module;
};