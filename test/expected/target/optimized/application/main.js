/// <reference path="../require.d.ts" />
define(["require", "exports"], function (require, exports) {
    var Application = (function () {
        function Application(message) {
            this.greeting = message;
        }
        Application.prototype.greet = function () {
            return "Hello, " + this.greeting;
        };
        return Application;
    })();
    exports.Application = Application;
});
//# sourceMappingURL=main.js.map