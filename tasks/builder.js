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

    grunt.registerTask('builder', 'Build task', function(){

        // Running all modules
        configuration.modules.forEach(function(module){
            module = require(configuration.modulePath + path.sep + module + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(configuration.builderPath);
            module.run();
        });

    });

    grunt.registerTask("default", ["builder"]);
};