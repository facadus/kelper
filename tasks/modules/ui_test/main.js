//External modules
var path = require('path');
var util = require("util");

// Module Compile
exports.init = function(grunt){
    var configuration = {};
    module = require(path.dirname(__dirname) + path.sep + "default").init(grunt);

    module.registerTask('ui_test', 'Build task', function(){

    });

    util._extend(module, {
        name: path.basename(__dirname),
        run: function(){
            console.log("*.test.html");
        }
    });

    return module;
};