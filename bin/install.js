#!/usr/bin/env node

var path = require("path");
var fs = require("fs");

var copyPath = path.resolve(process.cwd(), process.argv[2] || "src");
var BUF_LENGTH = 64 * 1024;
var _buff = new Buffer(BUF_LENGTH);

function readPackageJson(dependency) {
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
        console.log("File `package.json` was not found!");
    }

    return false;
}

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
}

function copySync(source, dest) {
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

var config = readPackageJson();

if (config && config.dependencies) {
    var copiedFF = [];
    for (var deps in config.dependencies) {
        var dependencyPackage = readPackageJson(deps);
        if (dependencyPackage && dependencyPackage.moduleType && dependencyPackage.moduleType.toUpperCase() == "AMD") {
            var directory = path.resolve(process.cwd(), "node_modules", deps);
            var files = fs.readdirSync(directory);
            files.forEach(function (file) {
                if (file !== "package.json") {
                    // Error if already copied
                    if (file in copiedFF) {
                        throw new Error("File `" + file + "` was already copied!");
                    }

                    // Remove is exists
                    if (fs.exists(path.resolve(copyPath, file))) {
                        console.log("Exists :D");
                    }

                    console.log(
                        path.resolve(directory, file),
                        path.resolve(copyPath, file)
                    );

                    // Copy
                    copySync(
                        path.resolve(directory, file),
                        path.resolve(copyPath, file)
                    );
                }
            });


        }
    }
}