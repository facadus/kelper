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

            var configuration = {
                options: {},
                merge: function(){
                    if(!arguments.length)
                        return this.options;
                    for(var i = 0; i < arguments.length; i++){
                        for(var key in arguments[i]){
                            this.options[key] = arguments[i][key];
                        }
                    }
                }
            };

            if(grunt.util.kindOf(config.minify.prefabs) == "array" && config.minify.prefabs.length){
                if(config.minify.prefabs.indexOf("requirejs") > -1){
                    var libraries = grunt.config.get("builder").requirejs;
                    switch(grunt.util.kindOf(libraries)){
                        case "string":
                            // File
                            libraries = grunt.file.readJSON(libraries);
                            break;
                        case "object":
                            // Plain
                            libraries = libraries.compile.options;
                            break;
                    }
                    config.minify.prefabs.splice[config.minify.prefabs.indexOf("requirejs"), 1];
                    configuration.options.reqjs = {files: [{ src: libraries.out, dest: libraries.out }]};
                }
            }

            if(typeof config.minify == "object"){
                // Object
                configuration.merge(config.minify);
            }else{
                // Set configuration from config file
                configuration.merge(grunt.file.readJSON(config.minify));
            }
            grunt.config.set("uglify", configuration.options);

            // Run Uglify
            grunt.task.run("uglify");
        }
    };

    return exports;
};