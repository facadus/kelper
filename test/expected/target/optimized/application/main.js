/// <reference path="../require.d.ts" />
define('common/main',["require", "exports"], function (require, exports) {
    var Common = (function () {
        function Common(message) {
            this.greeting = message;
        }
        Common.prototype.greet = function () {
            return "Hello, " + this.greeting;
        };
        return Common;
    })();
    return Common;
});
//# sourceMappingURL=main.js.map;
define('common', ['common/main'], function (main) { return main; });


define("application", function(){});
