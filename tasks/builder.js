module.exports = function(grunt){
    var builder = require("./modules/builder").init(grunt);
    // var compile = require("modules/compile");
    var optimizer = require("./modules/optimizer").init(grunt);

    grunt.registerTask('builder', 'Build task', function(){
        var config = {};
        config.compile = grunt.config.get("compile");
        config.builder = grunt.config.get("builder");
        config.optimization = grunt.config.get("optimization");

        if(typeof config.builder != "undefined"){
            builder.run(config.builder);
        }

        if(typeof config.optimization != "undefined"){
            optimizer.run(config.optimization);
        }

        grunt.log.writeln(this.name + " is running");
    });

};