/**
 * Created by pkotov on 29.01.2015.
 */

var path = require('path');

exports.init = function(grunt){
    return {
        loadPlugin: function(pluginName){
            var cwd = process.cwd();
            process.chdir(this.modulePath);
            grunt.loadNpmTasks(pluginName);
            process.chdir(cwd);
        },
        mergeObjects: function(){
            if(arguments.length > 1){
                var destination = arguments[0];
                for(var i = 1; i < arguments.length; i++){
                    var source = arguments[i];
                    for(var property in source){
                        if(grunt.util.kindOf(destination[property]) == "object" && grunt.util.kindOf(source[property]) == "object"){
                            destination[property] = destination[property] || {};
                            arguments.callee(destination[property], source[property]);
                        }else{
                            destination[property] = source[property];
                        }
                    }
                    return destination;
                }
            }
            return destination[0] || {};
        },
        makeClear: function(target){
            if(grunt.file.isDir(target) || grunt.file.isFile(target)){
                grunt.log.ok(path.relative(process.cwd(), target) + " has been deleted");
                grunt.file.delete(target, {force: true});
            }
        }
    }
};