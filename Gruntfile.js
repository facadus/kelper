'use strict';
var path = require("path");

module.exports = function (grunt) {
    grunt.registerTask("test", "Build task test", function(){
        var done = this.async();
        require('child_process').exec("mocha " + path.resolve(__dirname, "test/kelper.test.js"), function(err, stdout){
            grunt.log.write(stdout);
            done(err);
        });
    });
    grunt.registerTask("default", ["test"]);
};