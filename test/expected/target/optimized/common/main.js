/// <reference path="../require.d.ts" />
define(["require", "exports"], function (require, exports) {
    
    var Common = (function () {
        function Common(message) {
            this.greeting = message;
        }
        Common.prototype.greet = function () {
            return "Hello, " + this.greeting;
        };
        return Common;
    }());
    return Common;
});
//# sourceMappingURL=main.js.map