/**
 * Created by pkotov on 22.01.2015.
 */

exports.init = function(grunt){
    var exports = {};

    exports.run = function(config){
        if(typeof config.requirejs != "undefined"){
            // Loading RequireJS if needed -> Start
            var cwd = process.cwd();
            process.chdir(__dirname + "/../../");
            grunt.loadNpmTasks("grunt-contrib-requirejs");
            process.chdir(cwd);
            // Loading -> End

            if(typeof config.requirejs == "object"){
                // Object
                grunt.config.set("requirejs", config.requirejs);
            }else{
                // Set configuration from config file
                grunt.config.set("requirejs", {
                    compile: {
                        options: grunt.file.readJSON(config.requirejs)
                    }
                });
            }

            // Run RequireJS
            grunt.task.run("requirejs");
        }
    };

    return exports;
};