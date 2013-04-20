// vim:ts=4:sts=4:sw=4:
// This module can be loaded as a RequireJS module, a CommonJS module, or
// a browser script.  As a script, it creates a "UUID" global name space
// with the "generate" function.  Otherwise, it exports the "UUID"
// interface.
(function (definition) {

    // RequireJS
    if (typeof define === "function") {
        define([], function () {
            var exports = {};
            definition(exports);
            return exports;
        });

    // CommonJS
    } else if (typeof exports === "object") {
        definition(exports);

    // <script>
    } else {
        definition(UUID = {});
    }

})(function (exports) {

    // generates an RFC4122, version 4, UUID
    exports.generate = generate;
    function generate() {
        return R(8) + "-" + R(4) + "-4" + R(3) + "-" + R(8) + R(4);
    }

    // generates up to 8 random digits in the upper-case hexadecimal alphabet
    function R(n) {
        return (
            Math.random().toString(16) + "00000000"
        ).slice(2, 2 + n).toUpperCase();
    }

    // References:
    // http://www.ietf.org/rfc/rfc4122.txt (particularly version 4)
    // https://twitter.com/#!/kriskowal/status/157519149772447744
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    // http://note19.com/2007/05/27/javascript-guid-generator/
    // http://www.broofa.com/Tools/Math.uuid.js
    // http://www.broofa.com/blog/?p=151

});
