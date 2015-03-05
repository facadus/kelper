module.exports = function (grunt) {

    var path = require('path');

    var plugin = {};
    plugin.configuration = {
        builderPath: path.normalize(__dirname),
        modulePath: path.normalize(__dirname) + path.sep + "modules",
        operations: [
            "compile",
            "optimization",
            "finalization"
        ],
        phase: function (operation) {
            var $operations = [];
            var operation = (operation != true) ? operation : "finalization";

            switch (operation) {
                case "f":
                case "finalization":
                    $operations.push(
                        "ui_test",
                        "hashconstruction",
                        "finalization"
                    );
                case "o":
                case "optimization":
                    $operations.push(
                        "optimization"
                    );
                case "c":
                case "compile":
                    $operations.push(
                        "unit_test",
                        "compile"
                    );
                    break;
                default:
                    throw new Error("[ERROR] There is no '" + phase + "' phase");
            }

            $operations.reverse();
            return $operations;
        }
    };

    // Loading Environment file
    var env_file = grunt.option('target') || grunt.option('t') || 'local';
    try {
        var env_path = path.resolve(process.cwd(), "config/target", env_file);
        if (grunt.file.exists(env_path + ".json")) {
            plugin.environment = grunt.file.readJSON(env_path + ".json");
        } else if (grunt.file.exists(env_path + ".yml")) {
            plugin.environment = grunt.file.readYAML(env_path + ".yml");
        } else {
            throw new Error("[ERROR] There is no '" + env_file + "' environment file!")
        }
    } catch (ex) {
        grunt.log.error(ex);
        return 1;
    }

    // Add RequireJS
    if (plugin.environment.hasOwnProperty("base")) {
        if (!plugin.environment.base.hasOwnProperty("require")) {
            // Prepend RequireJS
            plugin.environment.base = grunt.util._.extend({
                require: path.resolve(__dirname, "../node_modules/grunt-contrib-requirejs/node_modules/requirejs/require")
            }, plugin.environment.base);
        }
    } else {
        plugin.environment.base = {
            "require": path.resolve(__dirname, "../node_modules/grunt-contrib-requirejs/node_modules/requirejs/require")
        }
    }

    plugin.configuration.operations.forEach(function (op) {
        grunt.registerTask('kelper:' + op, "Kelper's " + op + " module", function () {
            var oldConfig = {};
            if (!grunt.hasOwnProperty("test") || !grunt.test) {
                var modules = plugin.configuration.phase(op);
                modules.forEach(function (moduleName) {
                    module = require(plugin.configuration.modulePath + path.sep + moduleName + path.sep + "main").init(grunt);
                    module.modulePath = path.dirname(plugin.configuration.builderPath);
                    module.environment = plugin.environment;
                    module.lastConfigurations = oldConfig;
                    module.run();
                    oldConfig[moduleName] = module.configuration;
                });
            }
        });
    });

    grunt.registerTask("test", "Build task test", function () {
        var done = this.async();
        require('child_process').exec("mocha " + path.resolve(__dirname + "/../test/kelper.test.js"), function (err, stdout) {
            grunt.log.write(stdout);
            done(err);
        });
    });

    grunt.registerTask("default", ["kelper:" + plugin.configuration.operations.slice(-1)]);

    return plugin;
};