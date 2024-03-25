

// This export code, so same file can be used both as '<script src=...' in html,
// and as 'import' in js of worker service,
// was copied from the umd.js file, with small help from CoPilot.
// The define.amd property is a special flag,
// that indicates whether the current environment supports AMD-style module loading

//  im getting closer...
!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ?
        t(exports) : "function" == typeof define && define.amd ?
        define(["exports"], t) : t((e = "undefined" != typeof globalThis ?
        globalThis : e || self).hello = {
            world : async (text) => {
                console.log("Hello, world 77: " + text);
            }

        })
    }(this, (function(e) {
        // "use strict";
        // async function world() {
        // console.log("Hello, world 33!");
    //}
}));