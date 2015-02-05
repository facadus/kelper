/**
 * Created by pkotov on 03.02.2015.
 */

var grunt = require("grunt");
var path = require("path");
var glob = require("glob");
var kelper = require(path.resolve(__dirname, "../tasks/kelper"));
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();

describe("Kelper", function(){

    var lastPhase = "finalization";

    // Setting up Test options
    grunt.file.setBase(__dirname);
    grunt.file.delete("target", {force: true});
    grunt.test = true;

    beforeEach(function(){
        grunt.file.setBase(__dirname);
    });

    afterEach(function(){
        return true;
    });

    // Run base setup
    describe("Task setup", function(){
        var plugin = {};

        it('Run plugin base', function(){
            plugin = kelper(grunt);
        });

        it('Check plugin for being registered itself with Grunt', function(){
            should.exist(grunt.task._tasks["kelper"]);
        });

        it('Check module phases', function(){
            var modules = plugin.configuration.phase[lastPhase];
            assert.deepEqual(modules, plugin.configuration.modules, "Finalization phase doesn't include all phases");
        });
    });
    // Checking modules for errors

    var plugin = kelper(grunt);
    var modules = plugin.configuration.phase[lastPhase];

    describe("Checking modules", function(){
        modules.forEach(function(module){
            it(module, function(){
                module = require(plugin.configuration.modulePath + path.sep + module + path.sep + "main").init(grunt);
                assert.ok(module, "Works fine");
            });
        });
    });

    // Run modules and watch for results
    describe("Run modules and watch for results", function(){
        describe("Compile module", function(){
            var module = require(plugin.configuration.modulePath + path.sep + "compile" + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(plugin.configuration.builderPath);
            module.environment = plugin.environment;
            it("Run and check compiled files", function(done){
                var task = module.run();
                task.run(function(err){
                    if(err){
                        done(err);
                    }else{
                        glob(path.normalize(__dirname + "/expected/target/compiled/**/*.js"), function(err, files){
                            should.not.exist(err, "There is error in files");
                            files.forEach(function(file){
                                var fromFile = grunt.file.read(file);
                                var toFile = grunt.file.read(path.resolve(__dirname + "/target/compiled/", path.relative(__dirname + "/expected/target/compiled", file)));
                                should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                            });
                        });
                        done();
                    }
                });
            });
        });

        describe("Optimization module", function(){
            var module = require(plugin.configuration.modulePath + path.sep + "optimization" + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(plugin.configuration.builderPath);
            module.environment = plugin.environment;
            it("Run and check optimized files", function(done){
                module.run();
                process.nextTick(function(){
                    glob(path.normalize(__dirname + "/expected/target/optimization/**/*.js"), function(err, files){
                        should.not.exist(err, "There is error in files");
                        files.forEach(function(file){
                            var fromFile = grunt.file.read(file);
                            var toFile = grunt.file.read(path.resolve(__dirname + "/target/optimization/", path.relative(__dirname + "/expected/target/optimization", file)));
                            should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                        });
                    });
                    done();
                });
            });
        });

        describe("Finalization module", function(){
            var module = require(plugin.configuration.modulePath + path.sep + "finalization" + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(plugin.configuration.builderPath);
            module.environment = plugin.environment;
            it("Run and check optimized files", function(done){
                module.run();
                process.nextTick(function(){
                    glob(path.normalize(__dirname + "/expected/target/finalized/**/*.js"), function(err, files){
                        should.not.exist(err, "There is error in files");
                        files.forEach(function(file){
                            var fromFile = grunt.file.read(file);
                            var toFile = grunt.file.read(path.resolve(__dirname + "/target/finalized/", path.relative(__dirname + "/expected/target/finalized", file)));
                            should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                        });
                    });
                    done();
                });
            });

            /*
            var module = require(plugin.configuration.modulePath + path.sep + "hashconstruction" + path.sep + "main").init(grunt);
            module.modulePath = path.dirname(plugin.configuration.builderPath);
            module.environment = plugin.environment;
            it("Hash finalized files", function(done){
                module.run();
                process.nextTick(function(){
            */
            //      glob(path.normalize(__dirname + "/expected/target/hashconstruction/**/*.js"), function(err, files){
            /*
                        should.not.exist(err, "There is error in files");
                        files.forEach(function(file){
                            var fromFile = grunt.file.read(file);
                            var toFile = grunt.file.read(path.resolve(__dirname + "/target/optimization/", path.relative(__dirname + "/expected/target/optimization", file)));
                            should.equal(fromFile.replace(/(\r\n|\n|\r)/gm, ""), toFile.replace(/(\r\n|\n|\r)/gm, ""), "Files are not same (target and expected)");
                        });
                    });
                    done();
                });
            });
            */
        });
    });
});