//External modules
var path = require('path');

// Module Compile
exports.init = function(grunt){
    return {
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
        loadPlugin: function(pluginName){
            var cwd = process.cwd();
            process.chdir(this.modulePath);
            grunt.loadNpmTasks(pluginName);
            process.chdir(cwd);
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
        },
        mergeObjects: function(){
            if(arguments.length > 1){
                var destination = arguments[0];
                for(var i = 1; i < arguments.length; i++){
                    var source = arguments[i];
                    for (var property in source){
                        if(grunt.util.kindOf(destination[property]) == "object" && grunt.util.kindOf(source[property]) == "object") {
                            destination[property] = destination[property] || {};
                            arguments.callee(destination[property], source[property]);
                        } else {
                            destination[property] = source[property];
                        }
                    }
                    return destination;
                }
            }
            return destination[0] || {};
        },
        makeClear: function(target){
            if(grunt.file.isDir(target) || grunt.file.isFile(target)){
                grunt.file.delete(target, {force:true});
            }
        }
    }
};