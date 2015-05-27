var path = require("path");

exports.init = function (grunt) {
    'use strict';

    var dependencies = {};
    var includes = {};

    return {
        findDependencies: function (environment) {

            // Parse Libraries
            if (grunt.util.kindOf(environment.libraries) == "object" && Object.keys(environment.libraries).length > 0) {
                for (var libraryName in environment.libraries) {
                    var library = environment.libraries[libraryName];
                    if (library) {
                        // Check packages
                        if (grunt.util.kindOf(library.packages) == "object" && Object.keys(library.packages).length > 0) {
                            for (var packageName in library.packages) {
                                var pkg = library.packages[packageName];

                                if (pkg) {
                                    if (pkg.dependencies) {
                                        dependencies[packageName] = pkg.dependencies;
                                        if (pkg.replace) {
                                            for (var repl in pkg.replace) {
                                                var replPackage = path.relative(packageName, pkg.replace[repl]).replace(/\\/g, "/");
                                                dependencies[packageName].push("!" + replPackage + ".js");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Parse packages for configs
            if (grunt.util.kindOf(environment.packages) == "object" && Object.keys(environment.packages).length > 0) {
                for (var packageName in environment.packages) {
                    var pkg = environment.packages[packageName];
                    if (pkg) {
                        if (pkg.dependencies) {
                            dependencies[packageName] = pkg.dependencies;
                        }
                    }
                }
            }

            return this.parseDependencies(dependencies);
        },
        addFoundDependenciesToFiles: function (filePath) {
            for (var deps in dependencies) {
                dependencies[deps].push("!main.js");
                var file = path.resolve(filePath, deps, "main.js");

                // Getting dependencies
                var files = grunt.file.expand({
                    cwd: path.dirname(file)
                }, dependencies[deps]).map(function (iter) {
                    return './' + iter.replace(".js", "");
                });

                // Start replacing dependencies
                var openFile = grunt.file.read(file);
                var regexp = /define\(\[([^\0]*?)\], function \(/gm;
                var result = regexp.exec(openFile);

                // Find Dependencies ^
                if (result) {
                    var regEx = /["']([\w\/.]+)["']/gm;
                    var deps = {};
                    var m;

                    // Parse file's components
                    while ((m = regEx.exec(result[1])) != null) {
                        if (m.index === regEx.lastIndex) {
                            regEx.lastIndex++;
                        }
                        deps[path.resolve(path.dirname(file), m[1])] = m[1];
                    }

                    // Parse additional components
                    files.forEach(function (dependencies) {
                        var filePathed = path.resolve(path.dirname(file), dependencies);
                        if (deps[filePathed] == undefined) {
                            deps[filePathed] = dependencies;
                        }
                    });

                    // Calculate edits
                    var fixedPart = [];
                    for (var key in deps) {
                        fixedPart.push('"' + deps[key] + '"');
                    }
                    fixedPart = fixedPart.join(", ");
                    var replace = result[0].replace(result[1], fixedPart);

                    // Replace file data
                    openFile = openFile.replace(regexp, replace);

                    // Save fixed file
                    grunt.file.write(file, openFile);
                }
            }
        },
        parseDependencies: function (deps) {
            for (var dep in deps) {
                var tempDep = [];
                deps[dep].forEach(function (value, index) {
                    if (value.charAt(0) == '~') {
                        includes[dep] = (includes[dep] || []).concat(deps[dep][index]);
                    } else {
                        tempDep.push(deps[dep][index]);
                    }
                });
                deps[dep] = tempDep;

                if (deps[dep].length == 0) {
                    delete deps[dep];
                }
            }

            return deps;
        },
        getIncludes: function (sourceDir) {
            for (var incl in includes) {
                includes[incl].forEach(function(value, index){
                    includes[incl][index] = value.substring(1);
                });

                var files = [];
                grunt.file.expand({
                    cwd: path.resolve(process.cwd(), sourceDir, incl)
                }, includes[incl]).forEach(function(value){
                    var file = path.join(incl, value.substr(0, value.lastIndexOf('.')) || value).replace(/\\/g, "/");
                    files.push(file);
                });

                includes[incl] = files;
            }
            return includes;
        }
    }
};