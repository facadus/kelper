#!/usr/bin/env node

var fs = require("fs");

function readPackageJson(dependency) {
    var path = require("path");
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

var config = readPackageJson();

if (config && config.dependencies) {
    for (var deps in config.dependencies) {
        var dependencyPackage = readPackageJson(deps);
        if (dependencyPackage && dependencyPackage.moduleType && dependencyPackage.moduleType.toUpperCase() == "AMD") {
            console.log("Found module to copy : " + deps);
        }
    }
}