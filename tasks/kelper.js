module.exports = function (grunt) {
    'use strict';

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

    function typeOf(x) {
        var res = typeof(x);
        if (res === "object") {
            if (!x) return "null";
            if (Array.isArray(x)) return "array";
        } 
        return res;
    }

    function reportTypeMismatch(parent, child, path, contentType, overrideType) {
        grunt.log.writeln(
            [contentType,'property',path,'from',parent,'is overwritten with',overrideType,'in',child].join(' ')
        );
    }

    function recursiveMerge(parent, child, path, content, override) {
        var contentType = typeOf(content);
        var overrideType = typeOf(override);
        switch(contentType) {
            case "undefined": return override;
            case "object": 
                switch(overrideType) {
                    case "object":
                        Object.keys(override).forEach(function(key){
                            content[key] = recursiveMerge(
                                parent,
                                child,
                                path+'/'+key,
                                content[key],
                                override[key]
                            )
                        });
                        return content;
                    case "undefined":
                        return content;
                    default:
                        reportTypeMismatch(parent, child, path, contentType, overrideType);
                        return override;
                }
            default:
                if (overrideType === "undefined") {
                    return content;
                } else {
                    if (overrideType != contentType) {
                        if (overrideType === "object"
                            && contentType === "array"
                            && typeOf(override.concat) === "array") {
                            return content.concat(override.concat())
                        } else {
                            reportTypeMismatch(parent, child, path, contentType, overrideType);
                        }
                    }
                    return override;
                }
        }
    }

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
        if (content.extends) {
            content = recursiveMerge(env_file, content.extends, '', loadFile(content.extends), content);
        }
        return content;
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
