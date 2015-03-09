/**
 * Created by pkotov on 05.03.2015.
 */
define(function () {
    'use strict';

    var buildMap = {};

    return {
        version: "0.0.1",
        load: function (name, req, onLoad, config) {
            // Not needed
            if (name.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            if (this.checkNode() && config && config.isBuild) {
                this.__buildFile(name, req, onLoad, config);
            } else {
                this.__loadFile(sourceDir + "/" + name, onLoad);
            }
        },
        __loadFile: function (file, onLoad) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var response = this.response;
                require([rootDir + "node_modules/kelper/include/require/less.min"], function (less) {
                    var parsed = less.render(response);
                    parsed.then(function (result) {
                        onLoad(result.css);
                    });
                });
            };
            xhr.open("GET", file, true);
            xhr.send();
        },
        checkNode: function () {
            return typeof process !== "undefined" && process.versions && !!process.versions.node;
        },
        __buildFile: function (name, req, onLoad, config) {
            var path = require.nodeRequire('path');
            var less = require.nodeRequire('less');
            console.log(less);



            var path = require.nodeRequire('path');
            // ToDo: Fix this shit - Path is fail
            var filePath = path.resolve(process.cwd(), "src", name);
            var file = fs.readFileSync(filePath);
            var less = path.relative(
                config.dir,
                path.resolve(process.cwd(), "node_modules/kelper/include/require/less.min")
            );

        },
        write: function (pluginName, moduleName, write) {
            if (moduleName in buildMap) {
                write("define('" + pluginName + "!" + moduleName  + "', ['" + pluginName + "'], function (style) { return '" + buildMap[moduleName] + "'; });\n");
            }
        }
    }
});