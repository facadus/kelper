module.exports = function(grunt){

    grunt.registerTask('builder', 'Build task', function(){
        var config = {};
        config.builder = grunt.config.get("builder");
        config.optiomization = grunt.config.get("builder");

        var cwd = process.cwd();

        if(typeof config.builder != "undefined"){
            if(typeof config.builder.requirejs != "undefined"){

                // Loading RequireJS if needed -> Start
                process.chdir(__dirname + "/../");
                grunt.loadNpmTasks("grunt-contrib-requirejs");
                process.chdir(cwd);
                // Loading -> End

                // requirejs.config = grunt.file.readJSON(config.builder.requirejs);

                grunt.task.run(["requirejs"]);
            }

        }

        if(typeof config.optiomization != "undefined"){

        }


        grunt.log.writeln(this.name + " is running");
    });

};