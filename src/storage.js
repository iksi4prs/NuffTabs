

// This export code, so same file can be used both as '<script src=...' in html,
// and as 'import' in js of worker service,
// was copied from the umd.js file, with small help from CoPilot.
// The define.amd property is a special flag,
// that indicates whether the current environment supports AMD-style module loading

// storage warpper v#2 - using IndexedDB
// 'chrome.storage.local' (see why moved to it below),
// doesn't show in devtools (see: https://stackoverflow.com/a/27432365),
// which is annoying to use/debug, so moved to use IndexedDB,
// using lib called "idb" (see umd.js)

//  im getting closer...
// "SP" stands for "Storage Provider"
// TODO ranme for LS to SP
!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ?
        t(exports) : "function" == typeof define && define.amd ?
        define(["exports"], t) : t((e = "undefined" != typeof globalThis ?
        globalThis : e || self).LS = {
            db : null,
            world : async function(text) {
                console.log("Hello, world 77: " + text);
            },
            openDatabase: async function() {
                var version = 1;
                this.db = await idb.openDB('NuffTabs', 1, {
                  upgrade() {
                    this.db.createObjectStore('dictionary1');
                  },
                });},
              getItem: async function(key) {
                if (this.db == null){
                  await LS.openDatabase();
                }
                return (await this.db).get('dictionary1', key);
              },
              setItem: async function(key, val) {
                if (this.db == null){
                  await LS.openDatabase();
                }
                (await this.db).put('dictionary1', val, key);
              },
        })
    }(this, (function(e) {
        // "use strict";
        // async function world() {
        // console.log("Hello, world 33!");
    //}
}));



// storage wrapper v#1 - using 'chrome.storage.local'
// (migration to manifest v3 required moving from 'localStorage' to 'chrome.storage.local')
// https://stackoverflow.com/a/70708120
/*
const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({[key]: val}),
  removeItems: keys => chrome.storage.local.remove(keys),
};
*/
