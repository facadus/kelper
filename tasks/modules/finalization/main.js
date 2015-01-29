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
            }else{
                grunt.log.debug(this.name + " user configuration not found, continue");
            }

            // Step 1 = Uglify
            if(this.envelopment.uglify != "undefined"){
                configuration.uglify = {
                    options: this.envelopment.uglify
                }


                console.log(config);
                return;
                // Set uglify configuration
                grunt.config.set("uglify", configuration);

                // Run uglify
                this.loadPlugin("grunt-contrib-uglify");
                grunt.task.run("uglify");
            }

            // Step 2 = Resources
            if(this.envelopment.resources != "undefined"){
                // Copy forEach resources
            }


        },
        parse: function(configuration){
            // Parsing
            if(configuration.hasOwnProperty("source") && configuration.hasOwnProperty("target")){
                configuration.uglify = {
                    base: {
                        options: {},
                        files: {
                            expand: true,
                            src: process.cwd() + path.sep + path.normalize(configuration.source) + path.sep + "**" + path.sep + "*.js",
                            dest: process.cwd() + path.sep + path.normalize(configuration.target)
                        }
                    }
                }
                delete configuration.source;
                delete configuration.target;
            }
            console.log(configuration);

            return configuration;
        }
    });

    return module;
};