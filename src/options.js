// see notes about storage/database in the worker js.
// storage, using IndexedDB
// add comments....
async function LS_getItem(key) {
	return (await db).get('dictionary1', key);
}

async function LS_setItem(key, val) {
	return (await db).put('dictionary1', val, key);
}

async function openDatabase() {
    var version = 1;
    db = await idb.openDB('NuffTabs', 1, {
      upgrade(db) {
        db.createObjectStore('dictionary1');
      },
    });
}

// fill in selected options
async function init() {
	await openDatabase();

	var xx = await LS_getItem("key23");
	console.log("xx FRM OPTIONS = " + xx);

	var maxTabs = await LS_getItem('maxTabs');
	var discardCriterion = await LS_getItem('discardCriterion');
	var ignorePinned = await LS_getItem('ignorePinned');
	var showCount = await LS_getItem('showCount');
	
	if (!maxTabs && !discardCriterion && !ignorePinned && !showCount) {
		return;
	}

	var selector = document.getElementById("maxTabs");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == maxTabs) {
			child.selected = "true";
		break;
		}
	}

	var selector = document.getElementById("discardCriterion");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == discardCriterion) {
			child.selected = "true";
		break;
		}
	}

	var selector = document.getElementById("ignorePinned");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == ignorePinned) {
			child.selected = "true";
		break;
		}
	}

	var selector = document.getElementById("showCount");
	for (var i = 0; i < selector.children.length; i++) {
		var child = selector.children[i];
		if (child.value == showCount) {
			child.selected = "true";
		break;
		}
	}
}

function saveMe() {
	LS_setItem('maxTabs', document.getElementById("maxTabs").value);
	LS_setItem('discardCriterion', document.getElementById("discardCriterion").value);
	LS_setItem('ignorePinned', document.getElementById("ignorePinned").value);
	LS_setItem('showCount', document.getElementById("showCount").value);
	document.getElementById('messages').innerHTML = "Options saved.";
	setTimeout(function() {
		document.getElementById('messages').innerHTML = "";
	}, 1500);
}

function closeMe() {
	window.close();
}

function saveClose() {
	saveMe();
	setTimeout(function() {
		closeMe();
	}, 1000);
}

document.addEventListener('DOMContentLoaded', function () {
	if (document.getElementById('saveButton')) {
		document.getElementById('saveButton').addEventListener('click', saveMe);
	}
	if (document.getElementById('closeButton')) {
		document.getElementById('closeButton').addEventListener('click', closeMe);
	}
	if (document.getElementById('saveCloseButton')) {
		document.getElementById('saveCloseButton').addEventListener('click', saveClose);
	}
});

window.addEventListener("load", init);
