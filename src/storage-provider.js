

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


// !! To check the db in devtools, inspect the popup, not worker service.

// "SP" stands for "Storage Provider"
!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ?
        t(exports) : "function" == typeof define && define.amd ?
        define(["exports"], t) : t((e = "undefined" != typeof globalThis ?
        globalThis : e || self).SP = {
            db : null,
            helloworld : async function(text) {
                console.log("555001, Hello world !, text: '" + text + "'");
            },
            openDatabase: async function() {
                var dbName = 'NuffTabs';
                var version = 1;
                // https://github.com/jakearchibald/idb?tab=readme-ov-file#opendb
                this.db = await idb.openDB(dbName, version, {
                  upgrade(db, oldVersion, newVersion, transaction, event) {
                    db.createObjectStore('dictionary1');
                  },
                });},
              getItem: async function(key) {
                if (this.db == null){
                  await SP.openDatabase();
                }
                return (await this.db).get('dictionary1', key);
              },
              setItem: async function(key, val) {
                if (this.db == null){
                  await SP.openDatabase();
                }
                (await this.db).put('dictionary1', val, key);
              },
        })
    }(this, (function(e) {
        // "use strict";
        // async function helloworld() {
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
