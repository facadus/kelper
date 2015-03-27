/**
 * Created by pkotov on 03.02.2015.
 */

var grunt = require("grunt");
var path = require("path");
var kelper = require(path.resolve(__dirname, "../tasks/kelper"));
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();

describe("Kelper", function () {

    var lastPhase = "build";
    var oldConfig = {};

    // Setting up Test options
    grunt.file.setBase(__dirname);
    if(grunt.file.exists("target")) {
        grunt.file.delete("target", {force: true});
    }
    grunt.test = true;

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

    // Run modules and watch for results
    describe("Run modules and watch for results", function () {
        describe("Compile module", function () {
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
                        var files = grunt.file.expand(path.normalize(__dirname + "/expected/target/compiled/**/*.js"));
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
                        var files = grunt.file.expand(path.normalize(__dirname + "/expected/target/optimized/**/*.js"));
                        files.forEach(function (file) {
                            var fromFile = grunt.file.read(file);
                            var toFile = grunt.file.read(path.resolve(__dirname + "/target/optimized/", path.relative(__dirname + "/expected/target/optimized", file)));
                            should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                        });
                        done();
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

                // Fixing - Async - 0 seconds
                setTimeout(function () {
                    var task = module.run();
                    oldConfig["hashconstruction"] = module.configuration;
                    task.run(function (err) {
                        if (err) {
                            done(err);
                        } else {
                            var files = grunt.file.expand(path.normalize(__dirname + "/expected/target/hashconstruction/**/*.js"));
                            files.forEach(function (file) {
                                var fromFile = grunt.file.read(file);
                                var toFile = grunt.file.read(path.resolve(__dirname + "/target/optimization/", path.relative(__dirname + "/expected/target/optimization", file)));
                                should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                            });
                            done();
                        }
                    });
                }, 0);
            });
        });
    });
});