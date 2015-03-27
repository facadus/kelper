var path = require("path");
var runTask = require("grunt-run-task");

exports.init = function (grunt) {
    'use strict';

    return {
        loadPlugin: function (pluginName) {
            var cwd = process.cwd();
            try {
                process.chdir(this.modulePath);
                if (grunt.hasOwnProperty("test") && grunt.test) {
                    runTask.loadNpmTasks(pluginName);
                } else {
                    grunt.loadNpmTasks(pluginName);
                }
            } finally {
                process.chdir(cwd);
            }
        },
        runTask: function (pluginName, conf, subtask) {
            if (grunt.hasOwnProperty("test") && grunt.test) {
                if (grunt.util.kindOf(subtask) == "array") {
                    if (subtask.length > 0) {
                        var returned = {
                            tasks: [],
                            run: function (err) {
                                if (typeof err == "function") {
                                    try {
                                        this.tasks.forEach(function (task) {
                                            task.run(function (localErr) {
                                                if (localErr) {
                                                    throw new Error(localErr);
                                                }
                                            });
                                        });
                                    } catch (ex) {
                                        err.call(this, ex);
                                        return;
                                    }
                                    err.call(this);
                                }
                            }
                        };

                        subtask.forEach(function (task) {
                            if (conf.hasOwnProperty(task) && conf[task]) {
                                returned.tasks.push(runTask.task(pluginName + ":" + task, conf));
                            }
                        });

                        return returned;
                    } else {
                        return runTask.task(pluginName);
                    }
                } else {
                    return runTask.task(pluginName + ":" + (subtask ? subtask : "default"), conf);
                }
            } else {
                grunt.config.set(pluginName, conf);
                grunt.task.run(pluginName);
            }
        },
        mergeObjects: function mergeObj() {
            if (arguments.length > 1) {
                var destination = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    var source = arguments[i];
                    for (var property in source) {
                        if (grunt.util.kindOf(destination[property]) == "object" && grunt.util.kindOf(source[property]) == "object") {
                            destination[property] = destination[property] || {};
                            mergeObj(destination[property], source[property]);
                        } else {
                            destination[property] = source[property];
                        }
                    }
                }
                return destination;
            }
            return arguments[0] || {};
        },
        smartMerge: function mergeObj() {
            if (arguments.length > 1) {
                var destination = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    var source = arguments[i];
                    for (var property in source) {
                        // Merge objects
                        if (grunt.util.kindOf(destination[property]) == "object" && grunt.util.kindOf(source[property]) == "object") {
                            destination[property] = destination[property] || {};
                            mergeObj(destination[property], source[property]);
                        } else if (grunt.util.kindOf(destination[property]) == "array" && grunt.util.kindOf(source[property]) == "array") {
                            destination[property] = destination[property].concat(source[property]);
                        } else {
                            destination[property] = source[property];
                        }
                    }
                }
                arguments[0] = destination;
                return true;
            }
            return arguments[0] || {};
        },
        makeClear: function (target) {
            if (grunt.file.isDir(target) || grunt.file.isFile(target)) {
                grunt.verbose.ok(path.relative(process.cwd(), target) + " has been deleted");
                grunt.file.delete(target, {force: true});
            }
        },
        registerTask: function (title, description, callback) {
            if (grunt.hasOwnProperty("test") && grunt.test) {
                return runTask.registerTask(title, description, callback);
            } else {
                return grunt.registerTask(title, description, callback);
            }
        },
        isNotEmptyObject: function (obj) {
            return grunt.util.kindOf(obj) == "object" && Object.keys(obj).length > 0;
        },
        copyFiles: function (files) {
            if (grunt.util.kindOf(files) == "object") {

                var copyFilesDep = function (fileDep) {
                    if (grunt.util.kindOf(fileDep.files) == "array") {
                        fileDep.options = fileDep.options || {};
                        fileDep.files.forEach(function (file) {
                            var foundFiles = grunt.file.expand({
                                cwd: file.cwd
                            }, file.src);
                            if (foundFiles.length) {
                                foundFiles.forEach(function (foundFile) {
                                    if (fileDep.options.pattern && grunt.file.isMatch(fileDep.options.pattern, foundFile)) {
                                        grunt.file.copy(
                                            path.resolve(file.cwd, foundFile),
                                            path.resolve(file.dest, foundFile),
                                            {
                                                process: fileDep.options.process
                                            }
                                        );
                                    } else {
                                        grunt.file.copy(
                                            path.resolve(file.cwd, foundFile),
                                            path.resolve(file.dest, foundFile)
                                        );
                                    }
                                });
                            }
                        });
                    }
                }

                if (grunt.util.kindOf(files.files) == "array") {
                    copyFilesDep(files);
                } else {
                    for (var file in files) {
                        copyFilesDep(files[file]);
                    }
                }
            }

            return true;
        }
    }
};