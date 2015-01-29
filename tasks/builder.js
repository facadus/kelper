module.exports = function(grunt){

    var path = require('path');

    var configuration = {
        builderPath: path.normalize(__dirname),
        modulePath: path.normalize(__dirname) + path.sep + "modules",
        modules: [
            "compile",
            "optimization",
            "finalization"
        ]
    };

    // Loading Environment file
    var env_file = grunt.option('target') || 'local';
    try{
        var environment = grunt.file.readJSON(process.cwd() + path.sep + "config" + path.sep + "environment" + path.sep + env_file + ".json");
    }catch(ex){
        if(ex.origError.code == "ENOENT"){
            grunt.log.error("[ERROR] There is no '" + env_file + ".json' environment file!");
        }else{
            grunt.log.error("[ERROR] Unable to parse '" + env_file + ".json' environment file!");
        }
        return 1;
    }

    grunt.registerTask('builder', 'Build task', function(){

        // Running all modules
        configuration.modules.forEach(function(module){
            module = require(configuration.modulePath + path.sep + module + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(configuration.builderPath);
            module.environment = environment;
            module.run();
        });

    });

    grunt.registerTask("default", ["builder"]);
};