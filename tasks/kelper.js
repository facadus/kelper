module.exports = function (grunt) {
    'use strict';

    var _ = require('lodash');
    var path = require('path');

    var plugin = {};
    plugin.configuration = {
        builderPath: path.normalize(__dirname),
        modulePath: path.normalize(__dirname) + path.sep + "modules",
        operations: [
            "compile",
            "test",
            "build"
        ],
        phase: function (operation) {
            var $operations = [];
            var operation = (operation != true) ? operation : "build";

            switch (operation) {
                case "b":
                case "build":
                    $operations.push(
                        "cdn",
                        "ui_test",
                        "hashconstruction",
                        "finalization",
                        "optimization",
                        "unit_test",
                        "compile"
                    );
                    break;
                case "t":
                case "test":
                    $operations.push(
                        "unit_test"
                    );
                    break;
                case "c":
                case "compile":
                    $operations.push(
                        "compile"
                    );
                    break;
                default:
                    throw new Error("[ERROR] There is no '" + phase + "' phase");
            }

            $operations.reverse();

            if (grunt.option('skipTests')) {
                $operations = grunt.util._.without($operations, 'unit_test', 'ui_test');
            }

            return $operations;
        }
    };

    function customMerge(objValue, srcValue, key, object, source, stack) {
        if (_.isArray(objValue) && _.isArray(srcValue)) {
            return objValue;
        }

        if (_.isObject(objValue) && _.isArray(srcValue) && _.isArray(objValue.concat)) {
            return objValue.concat.concat(srcValue);
        }

        if (_.isString(objValue)) {
            return objValue;
        }
    }

    plugin.merge = function (content, loader) {
        var result = content;

        if (content.extends) {
            var base = [].concat(content.extends).map(loader);

            var args = [{}, content]
                .concat(base)
                .concat(customMerge);

            result = _.mergeWith.apply(_, args);

            delete result.extends;
        }

        return result;
    };

    function loadFile(env_file) {
        var env_path = path.resolve(process.cwd(), "config", env_file);

        var content = {};

        if (grunt.file.exists(env_path + ".json")) {
            content = grunt.file.readJSON(env_path + ".json");
        } else if (grunt.file.exists(env_path + ".yml")) {
            content = grunt.file.readYAML(env_path + ".yml");
        } else {
            throw new Error("[ERROR] There is no '" + env_file + "' environment file!")
        }

        return plugin.merge(
            content,
            function (name) {
                return loadFile(name);
            }
        );
    }

    // Loading Environment file
    var env_file = grunt.option('target') || grunt.option('t') || 'local';
    try {
        plugin.environment = loadFile(env_file);
    } catch (ex) {
        grunt.log.error(ex);
        return 1;
    }

    // Add RequireJS
    if (plugin.environment.hasOwnProperty("base")) {
        if (!plugin.environment.base.hasOwnProperty("require")) {
            // Prepend RequireJS
            plugin.environment.base = grunt.util._.extend({
                require: require.resolve("requirejs").substr(0, require.resolve("requirejs").lastIndexOf("requirejs") + "requirejs".length) + path.sep + "require"
            }, plugin.environment.base);
        }
    } else {
        plugin.environment.base = {
            "require": require.resolve("requirejs").substr(0, require.resolve("requirejs").lastIndexOf("requirejs") + "requirejs".length) + path.sep + "require"
        }
    }

    // Add RequireJS modules to RequireJS
    // ToDo start -> return back to normal paths
    plugin.environment.reqModules = {};
    //var reqModulesPath = path.resolve(path.dirname(plugin.configuration.builderPath), "include/require/*.req.js");
    //grunt.file.expand(reqModulesPath).forEach(function(requireModule){
    //    var name = /(\w+).req.js$/.exec(requireModule)[1];
    //    if(name == "style"){
    //        plugin.environment.reqModules["less"] = "{path.fromKelper}/node_modules/less/dist/less.min";
    //    }
    //    plugin.environment.reqModules[name] = "{path.fromKelper}/" + path.relative(path.dirname(__dirname), requireModule);
    //});

    var userFile = grunt.config.get("kelper");
    if (userFile && userFile['compile'] && typeof userFile['compile'] == "function") {
        var config = userFile['compile']();
        if (config.hasOwnProperty("plugins")) {
            config.plugins.forEach(function (reqPlugin) {
                plugin.environment.reqModules[path.basename(reqPlugin)] = "{path.fromRoot}/" + reqPlugin;
            });
        }
    }
    // ToDo End <<--

    plugin.configuration.operations.forEach(function (op) {
        grunt.registerTask('kelper:' + op, "Kelper's " + op + " module", function () {
            var oldConfig = {};
            if (!grunt.hasOwnProperty("test") || !grunt.test) {
                var modules = plugin.configuration.phase(op);
                var defConfiguration = grunt.util._.clone(grunt.config.get(), true);
                modules.forEach(function (moduleName) {
                    var module = require(plugin.configuration.modulePath + path.sep + moduleName + path.sep + "main").init(grunt);
                    module.modulePath = path.dirname(plugin.configuration.builderPath);
                    module.environment = plugin.environment;
                    module.lastConfigurations = oldConfig;
                    module.run();
                    oldConfig[moduleName] = module.configuration;
                });
                grunt.registerTask("kelper:returnConfiguration", function () {
                    grunt.config.init(defConfiguration);
                });
                grunt.task.run("kelper:returnConfiguration");
            }
        });
    });

    grunt.registerTask("kelper", ["kelper:" + plugin.configuration.operations.slice(-1)]);

    return plugin;
};
