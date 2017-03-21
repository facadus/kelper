/**
 * Created by pkotov on 03.02.2015.
 */

var grunt = require("grunt");
var path = require("path");
var kelper = require(path.resolve(__dirname, "../tasks/kelper"));
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();
var _ = require('lodash');

// Setting up Test options
grunt.file.setBase(__dirname);
if (grunt.file.exists("target")) {
    grunt.file.delete("target", {force: true});
}
grunt.test = true;

grunt.initConfig({
    kelper: {
        compile: function (defaults) {
            return {
                source: "src",
                target: "target/compiled",
                typescript: {
                    declaration: true
                }
            }
        },
        optimization: function () {
            return {
                source: "target/compiled",
                target: "target/optimized"
            }
        },
        finalization: function () {
            return {
                resourcePath: "resources",
                source: "target/optimized",
                target: "target/finalized"
            }
        }
    }
});

describe("Kelper", function () {

    var lastPhase = "build";
    var oldConfig = {};

    beforeEach(function () {
        grunt.file.setBase(__dirname);
    });

    afterEach(function () {
        return true;
    });

    // Run base setup
    describe("Task setup", function () {
        var plugin = {};

        it('Run plugin base', function () {
            plugin = kelper(grunt);
        });

        it('Check plugin for being registered itself with Grunt', function () {
            var modules = plugin.configuration.operations;
            modules.forEach(function (module) {
                should.exist(grunt.task._tasks["kelper:" + module]);
            });
        });
    });
    // Checking modules for errors

    var plugin = kelper(grunt);
    var modules = plugin.configuration.phase(lastPhase);

    describe("Checking modules", function () {
        modules.forEach(function (module) {
            it(module, function () {
                module = require(plugin.configuration.modulePath + path.sep + module + path.sep + "main").init(grunt);
                assert.ok(module, "Works fine");
            });
        });
    });

    function Ms(data) {
        this.data = data;
    }

    Ms.prototype.read = function (name) {
        var content = this.data[name] || {};

        if (content.extends) {
            content = plugin.merge(content, this.read(content.extends));
        }

        delete content.extends;

        return content;
    };

    describe("Recursive Merge", function () {
        it('Should extends deep objects', function () {

            var ms = new Ms({
                test: {
                    'extends': 'middle',
                    b: 2,
                    c: {
                        c2: 2
                    }
                },
                middle: {
                    'extends': 'base',
                    d: 3
                },
                base: {
                    a: 1,
                    c: {
                        c1: 1
                    }
                }
            });

            var r = {
                a: 1,
                b: 2,
                c: {
                    c1: 1,
                    c2: 2
                },
                d: 3
            };

            expect(ms.read('test')).to.deep.equal(r);

        });

        it('Should merge arrays objects', function () {

            var ms = new Ms({
                test: {
                    'extends': 'base',
                    a1: [1],
                    b: [1, 2],
                    c: {
                        concat: [1, 2]
                    }
                },
                base: {
                    a2: [2],
                    b: [3],
                    c: [3]
                }
            });

            var r = {
                a1: [1],
                a2: [2],
                b: [1, 2],
                c: [1, 2, 3]
            };

            expect(ms.read('test')).to.deep.equal(r);

        });

        it('Should replace string value', function () {

            var ms = new Ms({
                test: {
                    'extends': 'base',
                    c: {
                        text: 'abc'
                    }
                },
                base: {
                    c: {
                        text: '123'
                    }
                }
            });

            var r = {
                c: {
                    text: 'abc'
                }
            };

            expect(ms.read('test')).to.deep.equal(r);

        });

    });

    // Run modules and watch for results
    describe("Run modules and watch for results", function () {
        describe("Compile module", function () {
            this.timeout(5000);
            it("Run and check compiled files", function (done) {
                var module = require(plugin.configuration.modulePath + path.sep + "compile" + path.sep + "main").init(grunt);
                module.modulePath = path.dirname(plugin.configuration.builderPath);
                module.environment = plugin.environment;
                module.lastConfigurations = oldConfig;

                var task = module.run();
                oldConfig["compile"] = module.configuration;

                task.run(function (err) {
                    if (err) {
                        done(err);
                    } else {
                        var files = grunt.file.expand([
                            path.normalize(__dirname + "/expected/target/compiled/**/*.d.ts"),
                            path.normalize(__dirname + "/expected/target/compiled/**/*.js")
                        ]);
                        files.forEach(function (file) {
                            var fromFile = grunt.file.read(file);
                            var toFile = grunt.file.read(path.resolve(__dirname + "/target/compiled/", path.relative(__dirname + "/expected/target/compiled", file)));
                            should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                        });
                        done();
                    }
                });
            });
        });

        describe("Optimization module", function () {
            it("Run and check optimized files", function (done) {
                var module = require(plugin.configuration.modulePath + path.sep + "optimization" + path.sep + "main").init(grunt);
                module.modulePath = path.dirname(plugin.configuration.builderPath);
                module.environment = plugin.environment;
                module.lastConfigurations = oldConfig;

                var task = module.run();
                oldConfig["optimization"] = module.configuration;
                task.run(function (err) {
                    if (err) {
                        done(err);
                    } else {
                        // Fixing - Async tasks - 0.5 seconds
                        setTimeout(function () {
                            var files = grunt.file.expand(path.normalize(__dirname + "/expected/target/optimized/**/*.js"));
                            files.forEach(function (file) {
                                var fromFile = grunt.file.read(file);
                                var toFile = grunt.file.read(path.resolve(__dirname + "/target/optimized/", path.relative(__dirname + "/expected/target/optimized", file)));
                                should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                            });
                            done();
                        }, 500);
                    }
                });
            });
        });

        describe("Finalization module", function () {
            it("Run and check optimized files", function (done) {
                var module = require(plugin.configuration.modulePath + path.sep + "finalization" + path.sep + "main").init(grunt);
                module.modulePath = path.dirname(plugin.configuration.builderPath);
                module.environment = plugin.environment;
                module.lastConfigurations = oldConfig;

                var task = module.run();
                oldConfig["finalization"] = module.configuration;
                task.run(function (err) {
                    if (err) {
                        done(err);
                    } else {
                        var files = grunt.file.expand(path.normalize(__dirname + "/expected/target/finalized/**/*.js"));
                        files.forEach(function (file) {
                            var fromFile = grunt.file.read(file);
                            var toFile = grunt.file.read(path.resolve(__dirname + "/target/finalized/", path.relative(__dirname + "/expected/target/finalized", file)));
                            should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                        });
                        done();
                    }
                });
            });

            it("Hash finalized files", function (done) {
                module = require(plugin.configuration.modulePath + path.sep + "hashconstruction" + path.sep + "main").init(grunt);
                module.modulePath = path.dirname(plugin.configuration.builderPath);
                module.environment = plugin.environment;
                module.lastConfigurations = oldConfig;

                var task = module.run();
                oldConfig["hashconstruction"] = module.configuration;
                task.run(function (err) {
                    if (err) {
                        done(err);
                    } else {
                        // Fixing - Async - 0 seconds
                        var files = grunt.file.expand(path.normalize(__dirname + "/expected/target/hashconstruction/**/*.js"));
                        files.forEach(function (file) {
                            var fromFile = grunt.file.read(file);
                            var toFile = grunt.file.read(path.resolve(__dirname + "/target/finalized/", path.relative(__dirname + "/expected/target/finalized", file)));
                            should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                        });
                        done();
                    }
                });
            });
        });
    });
});