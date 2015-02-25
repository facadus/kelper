var path = require("path");

exports.init = function(grunt){
    var dependencies = [];
    return {
        findDependencies: function(environment){
            
            // Parse Libraries
            if (grunt.util.kindOf(environment.libraries) == "array" && environment.libraries.length > 0) {
               environment.libraries.forEach(function (library) {
                    if (library.hasOwnProperty("packages")) {
                        if (library.packages.hasOwnProperty("include") && grunt.util.kindOf(library.packages.include) == "array") {
                            library.packages.include.forEach(function (pkg) {
                                // Every Package
                                if(pkg.hasOwnProperty("dependencies")){
                                    dependencies[pkg.name] = pkg.dependencies;
                                }
                            });
                        }
                    }
                });
            }

            // Parse packages for configs
            if (grunt.util.kindOf(environment.packages) == "array" && environment.packages.length > 0) {
                environment.packages.forEach(function (pkg) {
                    if (typeof pkg == "object" && pkg.hasOwnProperty("name")) {
                        // Every Package
                        if(pkg.hasOwnProperty("dependencies")){
                            dependencies[pkg.name] = pkg.dependencies;
                        }
                    }
                });
            }

            return dependencies;
        },
        addFoundDependenciesToFiles: function(filePath){
            for(var deps in dependencies){
                dependencies[deps].push("!main.js");
                var file = path.resolve(filePath, deps, "main.js");

                // Getting dependencies
                var files = grunt.file.expand({
                    cwd: path.dirname(file)
                }, dependencies[deps]).map(function(iter){
                    return '"./' + iter.replace(".js", "") + '"';
                });

                // Start replacing dependencies
                var openFile = grunt.file.read(file);
                var regexp = /define\(\[([^\0]*?)\], function \(/gm;
                var result = regexp.exec(openFile);

                // Find Dependencies ^
                if(result){
                    // Calculate edits
                    var fixedPart = result[1] + ", " + files.join(', ');
                    var replace = result[0].replace(result[1], fixedPart);

                    // Replace file data
                    openFile = openFile.replace(regexp, replace);

                    // Save fixed file
                    grunt.file.write(file, openFile);
                }
            }
        }
    }
};