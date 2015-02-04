module.exports = function(grunt){

    var path = require('path');

    var plugin = {};
    plugin.configuration = {
        builderPath: path.normalize(__dirname),
        modulePath: path.normalize(__dirname) + path.sep + "modules",
        modules: [
            "compile",
            "optimization",
            "finalization",
            "hashconstruction"
        ],
        phase: {
            "c": ["compile"],
            "compile": ["compile"],
            "o": ["compile", "optimization"],
            "optimization": ["compile", "optimization"],
            "f": ["compile", "optimization", "finalization", "hashconstruction"],
            "finalization": ["compile", "optimization", "finalization", "hashconstruction"]
        }
    };

    // Loading Environment file
    var env_file = grunt.option('target') || 'local';
    try{
        plugin.environment = grunt.file.readJSON(process.cwd() + path.sep + "config" + path.sep + "target" + path.sep + env_file + ".json");
    }catch(ex){
        if(ex.origError.code == "ENOENT"){
            grunt.log.error("[ERROR] There is no '" + env_file + ".json' environment file!");
        }else{
            grunt.log.error("[ERROR] Unable to parse '" + env_file + ".json' environment file!");
        }
        return 1;
    }

    var phase = grunt.option("process") || grunt.option("p") || "finalization";
    var modules = plugin.configuration.phase[phase];
    if(!modules){
        grunt.log.error("[ERROR] There is no '" + phase + "' phase");
        return 1;
    }

    grunt.registerTask('kelper', 'Build task', function(){

        // Running all modules
        modules.forEach(function(module){
            module = require(plugin.configuration.modulePath + path.sep + module + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(plugin.configuration.builderPath);
            module.environment = plugin.environment;
            module.run();
        });

    });

    grunt.registerTask("default", ["kelper"]);

    return plugin;
};