/**
 * Created by pkotov on 22.01.2015.
 */
exports.init = function(grunt){
    var exports = {};

    exports.run = function(config){
        if(typeof config.typescript != "undefined"){
            // Loading Typescript if needed -> Start
            var cwd = process.cwd();
            process.chdir(__dirname + "/../../");
            grunt.loadNpmTasks("grunt-typescript");
            process.chdir(cwd);
            // Loading -> End

            var configuration = {};
            if(typeof config.typescript == "object"){
                // Object
                configuration = config.typescript;
            }else{
                // Set configuration from config file
                configuration = grunt.file.readJSON(config.typescript);
            }
            grunt.config.set("typescript", configuration);

            // Run Typoscript
            grunt.task.run("typescript");
        }
    };

    return exports;
};