
// note:
// !!! SO LATER REMOVE !!!
// we don't need the storage permission to use IndexedDB.

// to check content of db in devtools, need check 'storage' via
// badge, NOT via worker.
let db = null;
//var dbError = false;

//import { openDB, wrap, unwrap } from './libs/umd.js';
import './libs/umd.js';



async function get1(key) {
  return (await db).get('dictionary1', key);
}
async function set1(key, val) {
  return (await db).put('dictionary1', val, key);
}
/*
async function IDB_openDatabase(name) {

    const request = indexedDB.open(name);
    // for popup need to add window. ?
    //const request = window.indexedDB.open(name);

    request.onerror = function (event) {
        console.error("Problem opening DB.");
        dbError = true;
    };

    // request.onupgradeneeded = function (event) {
    //     db = event.target.result;
    //     const objectStore = db.createObjectStore('table1', { keyPath: 'key' });
    //     objectStore.transaction.oncomplete = function (event) {
    //         console.log("ObjectStore Created.");
    //     };
    //     initImpl();
    // };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("DB OPENED.");
        initImpl();
    };
}


// https://filipvitas.medium.com/indexeddb-with-promises-and-async-await-3d047dddd313
// https://developer.mozilla.org/en-US/docs/Web/API/IDBRequest/result
async function IDB_getItem(key){
  if (db) {
    const tx = db.transaction('table1', 'readwrite');
    const store  = tx.objectStore('table1');
    const item = await store.get(key);
    //await request;
    //await tx.complete;
    return item.result;
    getRequest.onsuccess = await function (event) {
        const existingRecord = event.target.result;
        if (existingRecord) {
            return resolve(event.target.result);
            //return existingRecord.value;
        } else {
         return undefined;
        }
    };
}
}
function IDB_setItem(key, value) {
  if (db) {
      const updateTransaction = db.transaction('table1', 'readwrite');
      const objectStore = updateTransaction.objectStore('table1');
      const getRequest = objectStore.get(key);
      getRequest.onsuccess = function (event) {
          const existingRecord = event.target.result;
          if (existingRecord) {
              existingRecord.value = value;
              const putRequest = objectStore.put(existingRecord);
              putRequest.onsuccess = function () {
                  console.log("Record updated:", existingRecord);
              };
          } else {
            const request = objectStore.add({ key: key, value: value });
            request.onsuccess = function () {
                console.log("Added:" + key + ", " + value);
            };
          }
      };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
*/
// storage wrapper
// (migration to manifest v3 required moving from 'localStorage' to 'chrome.storage.local')
// https://stackoverflow.com/a/70708120
const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async key => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({[key]: val}),
  removeItems: keys => chrome.storage.local.remove(keys),
};

//var dbName = "NuffTabs";
//var open = indexedDB.open(dbName, 1);

//import './storage.js'

// variables
var currentTabId; // ID of currently active tab
var maxTabs; // maximum number of tabs allowed per window
var startActive; // time at which active tab started being active
var tabTimes = new Array(); // array with activity times (tab times table)

var debug = true; // debug boolean

function debugLog(string) {
  if (debug) {
    console.log(string);
  }
}

// debug function
function printTimes() {
  //console.log(tabTimes)
  chrome.tabs.query({ }, function(tabs) {
    //debugLog(tabs);
  
    for (var i=0; i <tabs.length; i++) {
      var id = tabs[i].id;
      var ttl = tabs[i].title;
      if (ttl.length>40){
        ttl = ttl.substring(0,40)+"...";
      }
      if (tabTimes[id]) {
        debugLog("ID: " + id + ", last:" + tabTimes[id].lastActive + ", total:" + tabTimes[id].totalActive +" - \""+ttl+"\"");
      }
    }
    debugLog(" ")
  });
}

// initialize
 async function openDatabase() {
    var version = 1;
    db = await idb.openDB('NuffTabs', 1, {
      upgrade(db) {
        db.createObjectStore('dictionary1');
      },
    });
}

async function init() {
  await openDatabase();
   //IDB_openDatabase("NuffTabs");
   //db = await idb.openDB("NuffTabs");
   await set1("key23", "7779");
   var xx = await get1("key23");
   console.log("xx = " + xx);
 //}

//async function initImpl() {  
  //openDatabase("NuffTabs");
  // for(var i=0; i<10000; i++){
  //   if (db != null)
  //     break;
  //   if (dbError == true){
  //     console.error("failed to open db, error.");
  //     return;
  //   }
  //   sleep(10);
  // }
  // if (db == null){
  //   console.error("failed to open db, timeout.");
  //   return;
  // }
  //IDB_setItem("key22","val55")
  //var x = await IDB_getItem("key22");
  //console.log("x = " + x);

  // set defaults
  if (await LS.getItem('discardCriterion') == undefined) {
    LS.setItem('discardCriterion', 'oldest');
  }
  if (await LS.getItem('maxTabs') == undefined) {
    LS.setItem('maxTabs', 10); // default
  }
  if (await LS.getItem('ignorePinned') == undefined) {
    LS.setItem('ignorePinned', 1);
  }
  if (await LS.getItem('showCount') == undefined) {
    LS.setItem('showCount', 1);
  }
  
  updateCurrentTabId();
  
  // set the usage and last active time for each tab if necessary
  chrome.tabs.query({ }, function(tabs){
    for (var i=0; i <tabs.length; i++) {
      createTimes(tabs[i].id);
    }
    //debugLog(tabTimes);
  });
  
  // start time for activation of current tab
  startActive = Date.now()
  
  updateBadge();
}

// add an entry to the tab times table
function createTimes(tabId) {
  tabTimes[tabId] = {totalActive:0, lastActive: Date.now()};
}

// update count on badge (only valid for active window)
async function updateBadge() {
  if (await LS.getItem('showCount') == '1'){
    chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 92] });
    
    chrome.tabs.query({ lastFocusedWindow: true }, async function(tabs) {
      if (await LS.getItem('ignorePinned') == '1') {
        tabs = tabs.filter(function (tab) {
          return !tab.pinned;
        });
      }
      chrome.action.setBadgeText({ text: tabs.length.toString()});
    });
  }
  else {
    chrome.action.setBadgeText({ text: ''});
  }
}

// update active times and current ID
function updateTimesAndId() {
  // update total active time for previous tab
  // debugLog('Previous tab: '+currentTabId);
  if (currentTabId > -1) {
    chrome.tabs.get(currentTabId, function(tab){
      if (tab){
        
        //console.log('Previous tab: ' + currentTabId);
        if (currentTabId > -1) {
          // set last active time
          tabTimes[currentTabId].lastActive = Date.now();
          
          // update total active time
          var duration = Date.now() - startActive;
          debugLog('Adding '+(Math.floor(duration/10)/100)+'s to tab '+currentTabId);
          tabTimes[currentTabId].totalActive = tabTimes[currentTabId].totalActive + duration;
        }
      }
      startActive = Date.now();
      printTimes();
    });
  }
  else {
    startActive = Date.now();
    printTimes();
  }
  
  updateCurrentTabId();
}

// set the ID of the current tab
function updateCurrentTabId() {
  chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
    if (typeof tabs[0] === 'undefined') {
      currentTabId = -1;
    }
    else {
      currentTabId = tabs[0].id;
      //debugLog("Current: "+currentTabId);
    }
    debugLog('currentTabId: '+currentTabId);
  });
}

// actions to perform upon adding a tab
function checkTabAdded(newTabId) {
  
  // check tabs of current window
  chrome.tabs.query({ currentWindow: true }, async function(tabs) {

    if (await LS.getItem('ignorePinned') == '1') {
      tabs = tabs.filter(function (tab) {
        return !tab.pinned;
      });
    }
    
    // debugLog("num of tabs: " +tabs.length)
    
    // tab removal criterion
    maxTabs = await LS.getItem('maxTabs');
    while (tabs.length > maxTabs) {
      debugLog("New tab: "+newTabId)
      debugLog("Preparing to remove tab...")
      printTimes();
      
      var tabInd = 0; // must be overwritten below
      if (tabs[tabInd].id == newTabId) {
        tabInd = 1;
      }
      switch(await LS.getItem('discardCriterion')) {

        case 'oldest': // oldest tab
          for (var i=0; i<tabs.length; i++) {
            if (tabs[i].id != newTabId && tabs[i].id != currentTabId) { // exclude new and current
              // find tab with lowest ID
              if (tabs[i].id < tabs[tabInd].id) {
                //tabId = tabs[i].id;
                tabInd = i;
              }
            }
          }
          break;
        
        case 'newest': // newest tab
          for (var i=0; i<tabs.length; i++) {
            // find tab with highest ID
            if (tabs[i].id > tabs[tabInd].id) {
              //tabId = tabs[i].id;
              tabInd = i;
            }
          }
          break;
        
        case 'LRU': // tab with lowest lastActive
          for (var i=0; i<tabs.length; i++) {
            if (tabs[i].id != newTabId && tabs[i].id != currentTabId) { // exclude new and current
              if (tabTimes[tabs[i].id].lastActive < tabTimes[tabs[tabInd].id].lastActive) {
                tabInd = i;
              }
            }
          }
          break;

        case 'LFU': // tab with lowest totalActive
          for (var i=0; i<tabs.length; i++) {
            if (tabs[i].id != newTabId && tabs[i].id != currentTabId) { // exclude new and current
              if (tabTimes[tabs[i].id].totalActive < tabTimes[tabs[tabInd].id].totalActive) {
                tabInd = i;
              }
            }
          }
          break;
        
        case 'random': // random tab
          tabId = newTabId;
          while (tabId == newTabId || tabId == currentTabId) { // exclude new tab
            tabInd = Math.floor(Math.random() * (tabs.length-1));
            tabId = tabs[tabInd].id;
          }
          break;
        default:
      }
      
      var tabId = tabs[tabInd].id;
      
      //debugLog('Chosen: '+tabId)
      chrome.tabs.get(tabId, function(tab){
        debugLog('Removing tab '+tab.id+': "'+tab.title+'", active time '+(Math.floor(tabTimes[tab.id].totalActive/10)/100)+'s, last active: '+tabTimes[tab.id].lastActive);
        removeTimes(tab.id);
        printTimes();
      });

      // remove tab
      chrome.tabs.remove(tabId, function() {});
      tabs.splice(tabInd,1); // remove from list
      //removeTimes(tabId);
    }
    updateBadge();
  });
}

// remove entry from tab times table
function removeTimes(tabId) {
  delete tabTimes[tabId];
}

chrome.tabs.onActivated.addListener(function(activeInfo){
  debugLog("tab " + activeInfo.tabId + " activated");
  updateTimesAndId();
  updateBadge();
  // debugLog("Window=" + activeInfo.windowId + ", Tab="+activeInfo.tabId);
});

chrome.tabs.onCreated.addListener(function(tab) {
  debugLog("tab " + tab.id + " created");
  createTimes(tab.id);
  updateTimesAndId();
  checkTabAdded(tab.id); // contains updateBadge
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  debugLog("tab " + tabId + " removed");
  removeTimes(tabId);
  updateTimesAndId();
  updateBadge();
});

chrome.tabs.onDetached.addListener(function(tab) {
  debugLog("tab " + tab.id + " detached");
  updateBadge();
});

chrome.tabs.onAttached.addListener(function(tab) {
  debugLog("tab " + tab.id + " attached");
  checkTabAdded(tab.id); // contains updateBadge
});

chrome.windows.onFocusChanged.addListener(function(windowId) {
  debugLog("window focus changed: "+windowId);
  updateTimesAndId();
  updateBadge();
});

init();
