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
                configuration = this.mergeObjects(configuration, config);
            }else{
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            this.makeClear(configuration.target);

            configuration.uglify = {
                options: this.environment.uglify
            };

            // Step 1 = Uglify
            if(typeof this.environment.uglify != "undefined"){

                var fileList = {};

                // Parse libraries
                if(grunt.util.kindOf(this.environment.libraries) == "array"){
                    this.environment.libraries.forEach(function(library){
                        if(typeof library == "object" && library.hasOwnProperty("name")){
                            fileList[process.cwd() + path.sep + path.normalize(configuration.target) + path.sep + library.name + path.sep + "main.js"] = process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + library.name + path.sep + "main.js";
                        }
                    });
                }else{
                    grunt.log.error("[ERROR] Unknown format of environment library, please fix it");
                }

                // Parse packages
                if(grunt.util.kindOf(this.environment.packages) == "array"){
                    this.environment.packages.forEach(function(pkg){
                        if(typeof pkg == "object" && pkg.hasOwnProperty("name")){
                            fileList[process.cwd() + path.sep + path.normalize(configuration.target) + path.sep + pkg.name + path.sep + "main.js"] = process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + pkg.name + path.sep + "main.js";
                        }
                    });
                }else{
                    grunt.log.error("[ERROR] Unknown format of environment package, please fix it");
                }

                configuration.uglify.minimize = {
                    files: fileList
                };
            }

            // Step 2 = Resources
            if(grunt.util.kindOf(this.environment.resources) == "array" && typeof configuration.resourcePath != "undefined"){

                // Empty files
                configuration.copy = {
                    resources: {
                        files: []
                    }
                };

                // Adding files if needed
                this.environment.resources.forEach(function(resource){
                    configuration.copy.resources.files.push({
                        expand: true,
                        cwd: process.cwd() + path.sep + path.normalize(configuration.resourcePath) + path.sep + resource + path.sep,
                        src: ["*.*", "**/*.*"],
                        dest: process.cwd() + path.sep + path.normalize(configuration.target)
                    });
                });

                grunt.config.set("copy", configuration.copy);

                // Run Task
                this.loadPlugin("grunt-contrib-copy");
                grunt.tasks(["copy"]);
            }

            // Step 3 = Libs
            if(grunt.util.kindOf(this.environment.base) == "object"){

                var libs = {};
                libs[process.cwd() + path.sep + path.normalize(configuration.target) + path.sep + "base" + path.sep + "main.js"] = [];
                for(var lib in this.environment.base){
                    libs[process.cwd() + path.sep + path.normalize(configuration.target) + path.sep + "base" + path.sep + "main.js"].push(process.cwd() + path.sep + path.normalize(this.environment.base[lib]) + ".js");
                }

                configuration.uglify.libs = {
                    files: libs
                };
            }

            // Set uglify configuration
            grunt.config.set("uglify", configuration.uglify);

            // Run uglify
            this.loadPlugin("grunt-contrib-uglify");
            grunt.tasks(["uglify"]);
        }
    });

    return module;
};