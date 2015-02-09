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
            "hashconstruction",
            "ui_test"
        ],
        phase: function(operation){
            if(typeof operation != "undefined"){
                switch (operation) {
                    case "c":
                    case "compile":
                        return ["compile"];
                    case "o":
                    case "optiomization":
                        return ["compile", "optimization"];
                    case "f":
                    case "finalization":
                        return ["compile", "optimization", "finalization", "hashconstruction", "ui_test"];
                    default:
                        throw new Error("[ERROR] There is no '" + phase + "' phase");
                }
            }
            return ["compile", "optimization", "finalization", "hashconstruction", "ui_test"];
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
    var modules = plugin.configuration.phase(phase);

    grunt.registerTask('kelper', 'Build task', function(){

        if(!grunt.hasOwnProperty("test") || !grunt.test){
            // Running all modules
            modules.forEach(function(module){
                module = require(plugin.configuration.modulePath + path.sep + module + path.sep + "main").init(grunt);
                module.modulePath = path.dirname(plugin.configuration.builderPath);
                module.environment = plugin.environment;
                module.run();
            });
        }

    });

    grunt.registerTask("test", "Build task test", function(){
        var done = this.async();
        require('child_process').exec("mocha " + path.resolve(__dirname + "/../test/kelper.test.js"), function(err, stdout){
            grunt.log.write(stdout);
            done(err);
        });
    });

    grunt.registerTask("default", ["kelper"]);

    return plugin;
};