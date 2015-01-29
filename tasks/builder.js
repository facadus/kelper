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

    // Loading Envelopment file
    var env_file = grunt.option('target') || 'local';
    try{
        var envelopment = grunt.file.readJSON(process.cwd() + path.sep + "config" + path.sep + "envelopment" + path.sep + env_file + ".json");
    }catch(ex){
        if(ex.origError.code == "ENOENT"){
            grunt.log.error("[ERROR] There is no '" + env_file + ".json' envelopment file!");
        }else{
            grunt.log.error("[ERROR] Unable to parse '" + env_file + ".json' envelopment file!");
        }
        return 1;
    }

    grunt.registerTask('builder', 'Build task', function(){

        // Running all modules
        configuration.modules.forEach(function(module){
            module = require(configuration.modulePath + path.sep + module + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(configuration.builderPath);
            module.envelopment = envelopment;
            module.run();
        });

    });

    grunt.registerTask("default", ["builder"]);
};