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

            if (config && config.isBuild) {
                this.__buildFile(name, req, onLoad, config);
            } else {
                this.__loadFile(sourceDir + "/" + name, onLoad);
            }
        },
        __compile: function (less, contents, onError, onSuccess) {
            var parsed = less.render(contents, function (e, output) {
                if (e) {
                    onError(e);
                } else {
                    onSuccess(output);
                }
            });
        },
        __loadFile: function (file, onLoad) {
            var xhr = new XMLHttpRequest();
            var object = this;
            xhr.onload = function () {
                var response = this.response;
                require(["less"], function (less) {
                    object.__compile(less, response, onLoad.error, function (css) {
                        onLoad(css.css);
                    });
                });
            };
            xhr.open("GET", file, true);
            xhr.send();
        },
        __buildFile: function (name, req, onLoad, config) {
            var path = require.nodeRequire('path');
            var less = require.nodeRequire('less');

            // ToDo: Fix this shit - Path is fail
            var filePath = path.resolve(process.cwd(), "src", name);
            try {
                var response = fs.readFileSync(filePath, 'utf8');
                this.__compile(less, response, onLoad.error, function (css) {
                    buildMap[name] = css.css;
                    onLoad(css.css);
                });
            } catch (e) {
                onLoad.error(e);
            }
        },
        normalize: function(name, normalize){
            return normalize(name);
        },
        write: function (pluginName, moduleName, write) {
            if (moduleName in buildMap) {
                write("define('" + pluginName + "!" + moduleName + "', ['" + pluginName + "'], function (style) { return '" + this.escape(buildMap[moduleName]) + "'; });\n");
            }
        },
        escape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r");
        }
    }
});