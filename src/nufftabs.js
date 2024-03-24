// storage warpper v#2 - using IndexedDB
// 'chrome.storage.local' (see why moved to it below),
// doesn't show in devtools (see: https://stackoverflow.com/a/27432365),
// which is annoying to use/debug, so moved to use IndexedDB,
// using lib called "idb" (see umd.js)
import './libs/umd.js';
let db = null;
const LS =  {
  openDatabase: async () => {
    var version = 1;
    db = await idb.openDB('NuffTabs', 1, {
      upgrade(db) {
        db.createObjectStore('dictionary1');
      },
    });},
  getItem: async key => {
    if (db == null){
      await LS.openDatabase();
    }
    return (await db).get('dictionary1', key);
  },
  setItem: async (key, val) => {
    if (db == null){
      await LS.openDatabase();
    }
    (await db).put('dictionary1', val, key);
  },
};

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

async function init() {
  //await openDatabase();
  
  { // for debug/tests
    await LS.setItem("test", "8021");
    var test = await LS.getItem("test");
    console.log("test = " + test);
  }

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
