var Test = (function () {
    function Test(message) {
        this.greeting = message;
    }
    Test.prototype.greet = function () {
        return "Hello, " + this.greeting;
    };
    return Test;
})();
var greeter = new Test("world");
alert(greeter.greet());
//# sourceMappingURL=test.js.map