/**
 * Created by pkotov on 22.01.2015.
 */
exports.init = function(grunt){
    var exports = {};

    exports.run = function(config){
        if(typeof config.minify != "undefined"){
            // Loading RequireJS if needed -> Start
            var cwd = process.cwd();
            process.chdir(__dirname + "/../../");
            grunt.loadNpmTasks("grunt-contrib-uglify");
            process.chdir(cwd);
            // Loading -> End

            if(typeof config.minify == "object"){
                // Object
                grunt.config.set("uglify", config.minify);
            }else{
                // Set configuration from config file
                grunt.config.set("uglify", {
                    options: grunt.file.readJSON(config.minify)
                });
            }

            // Run RequireJS
            grunt.task.run("uglify");
        }
    }
};