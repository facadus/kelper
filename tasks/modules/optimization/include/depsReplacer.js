var path = require("path");

exports.init = function (grunt) {
    'use strict';

    var config = grunt.config.get("replaceDependencies");

    return {
        replaceDependencies: function () {
            for(var plugin in config){
                module = config[plugin];
                var options = module.options;
                if (options.create && options.name && options.name.length) {
                    var oldDefine = this.generateOriginalModuleDefine(options.name);
                    var newDefine = this.generateReplaceModuleDefine(options.name, options.requireDeps);
                    var fileData = grunt.file.read(options.out);
                    fileData = fileData.replace(oldDefine, newDefine);
                    grunt.file.write(options.out, fileData);

                    grunt.log.ok("File " + options.name + " was modified");
                }
            }
        },
        generateOriginalModuleDefine: function(name){
            // Based on RequireJS Build file @ 28478
            return 'define("' + name + '", function(){});';
        },
        generateReplaceModuleDefine: function(name, deps){
            return 'define("' + name + '", ["' + deps.join('", "') + '"], function(){});';
        }
    }
};