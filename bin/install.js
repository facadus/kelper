#!/usr/bin/env node

var path = require("path");
var fs = require("fs");
var EoL = require('os').EOL;

var copyPath = path.resolve(process.cwd(), process.argv[2] || "src");
var BUF_LENGTH = 64 * 1024;
var _buff = new Buffer(BUF_LENGTH);

var readPackageJson = function (dependency) {
    if (dependency) {
        dependency = "node_modules/" + dependency;
    } else {
        dependency = "";
    }

    try {
        var config = fs.readFileSync(path.resolve(process.cwd(), dependency, "package.json"), "utf8");
        try {
            return JSON.parse(config);
        } catch (ex) {
            console.log("File `package.json` can not be parsed!");
        }
    } catch (ex) {
        console.log("File `" + dependency + "/package.json` was not found!");
    }

    return false;
};

var copyFileSync = function (srcFile, destFile) {
    var fdr = fs.openSync(srcFile, 'r');
    var stat = fs.fstatSync(fdr);
    var fdw = fs.openSync(destFile, 'w', stat.mode);
    var bytesRead = 1;
    var pos = 0;

    while (bytesRead > 0) {
        bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
        fs.writeSync(fdw, _buff, 0, bytesRead);
        pos += bytesRead;
    }

    fs.closeSync(fdr);
    fs.closeSync(fdw);
};

var copySync = function (source, dest) {
    var stats = fs.statSync(source);
    var destFolder = path.dirname(dest);

    if (stats.isFile()) {
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder);
        }
        copyFileSync(source, dest);
    } else if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        var contents = fs.readdirSync(source);
        contents.forEach(function (content) {
            copySync(
                path.join(source, content),
                path.join(dest, content)
            );
        });
    }
}

var deleteSync = function deleteSync(path) {
    if (fs.existsSync(path)) {
        var stats = fs.statSync(path);
        if (stats.isFile()) {
            fs.unlinkSync(path);
        } else if (stats.isDirectory()) {
            fs.readdirSync(path).forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteSync(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
};

var config = readPackageJson();

if (config && config.dependencies) {
    var copiedFF = [];
    for (var deps in config.dependencies) {
        if (deps !== "kelper") { // TODO: get from package.json
            var dependencyPackage = readPackageJson(deps);
            if (dependencyPackage && dependencyPackage.moduleType && dependencyPackage.moduleType.toUpperCase() == "AMD") {
                var directory = path.resolve(process.cwd(), "node_modules", deps);
                var files = fs.readdirSync(directory);
                if (files.length) {
                    console.log("\u2565 Copied files & folders");
                    files.forEach(function (file) {
                        if (file !== "package.json" && file !== "Gruntfile.js" && !/^\./gm.test(file)) {
                            // Error if already copied
                            var relFile = path.relative(
                                process.cwd(),
                                path.resolve(copyPath, file)
                            );

                            if (relFile in copiedFF) {
                                throw new Error("File `" + file + "` was already copied!");
                            }

                            // Remove is exists
                            deleteSync(path.resolve(copyPath, file));

                            // Output
                            if (file == files[files.length - 1]) {
                                console.log("\u2559\u2500 " + file);
                            } else {
                                console.log("\u255F\u2500 " + file);
                            }

                            // Copy
                            copySync(
                                path.resolve(directory, file),
                                path.resolve(copyPath, file)
                            );

                            // Push to copiedFF
                            copiedFF.push(
                                path.relative(
                                    process.cwd(),
                                    path.resolve(copyPath, file)
                                )
                            );
                        }
                    });
                }
            }
        }
    }

    var pathToGitIgnore = path.resolve(process.cwd(), ".gitignore");
    copiedFF.push("node_modules");
    copiedFF = copiedFF.map(function (result) {
        return "/" + result.replace(/\\/gm, "/");
    });

    var toAppend = [];
    if (fs.existsSync(pathToGitIgnore)) {
        var parsedGitIgnore = fs.readFileSync(pathToGitIgnore, "utf8");
        copiedFF.forEach(function (rules) {
            var regEx = new RegExp("^" + rules.replace(/\//gm, "\\/") + "$", "gm");
            if (!regEx.test(parsedGitIgnore)) {
                toAppend.push(rules);
            }
        });
        fs.appendFileSync(pathToGitIgnore, EoL + toAppend.join(EoL));
    } else {
        fs.writeFileSync(pathToGitIgnore, EoL + copiedFF.join(EoL));
    }
}