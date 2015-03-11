'use strict';
var path = require("path");

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-exec');

    grunt.initConfig({
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],
                createTag: false,
                push: false,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
            }
        },
        exec: {
            pack: {
                cmd: 'npm pack'
            },
            test: {
                cmd: 'mocha ' + path.resolve(__dirname, 'test/kelper.test.js')
            }
        }
    });

    grunt.registerTask("test", ["exec:test"]);
    grunt.registerTask('patch', ['test', 'bump:patch', 'exec:pack']);

};