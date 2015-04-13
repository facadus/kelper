//External modules
var path = require('path');
var util = require("util");
var EoL = require('os').EOL;

// Module Compile
exports.init = function (grunt) {
    'use strict';

    var module = require(path.join(path.dirname(__dirname), "default")).init(grunt);
    var configuration = {};

    module.registerTask('cdn', 'Make CDN files task', function () {
        var hash = module.lastConfigurations.hashconstruction.libraries;

        // Generate new AppNoCache with CDN
        var hashConstruction = require("../hashconstruction/main").init(grunt);
        hashConstruction.modulePath = module.modulePath;
        hashConstruction.environment = module.environment;
        hashConstruction.lastConfigurations = module.lastConfigurations;
        hashConstruction.setConfiguration(module.mergeObjects(hashConstruction.getConfiguration(), module.lastConfigurations.finalization));
        hashConstruction.generateAppNoCache({
            libraries: hash.libraries,
            libs: hash.libs,
            url: module.environment.cdnUrl
        });

        // Generate CDN File
        module.generateCDNFiles(module.mergeObjects(hash.libraries, {
            base: hash.libs
        }));
    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function () {
            if(this.environment.cdnUrl) {
                this.getConfiguration();
                this.configuration = configuration;
                return this.runTask("cdn", {default: {}}, []);
            }
        },
        getConfiguration: function () {
            // Load default configuration of Hash contructor
            var configFile = path.resolve(__dirname, "config/default.json");
            if (grunt.file.exists(configFile)) {
                try {
                    configuration = grunt.file.readJSON(configFile);
                    grunt.log.debug(this.name + " plugin default configuration is loaded!");
                } catch (ex) {
                    grunt.log.error("[ERROR] " + this.name + " plugin default configuration has error!");
                    configuration = {};
                }
            }

            return configuration;
        },
        generateCDNFiles: function(files){
            var cdnFile = path.resolve(process.cwd(), this.lastConfigurations.finalization.target, configuration.cdnFile);
            var output = "";
            for(var file in files){
                output += file + path.sep + files[file] + ".js" + EoL;
            }
            grunt.file.write(cdnFile, output);
            return true;
        }
    });

    return module;
};