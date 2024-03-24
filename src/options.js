// storage wrapper
// (migration to manifest v3 required moving from 'localStorage' to 'chrome.storage.local')
// https://stackoverflow.com/a/70708120
const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async key => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({[key]: val}),
    removeItems: keys => chrome.storage.local.remove(keys),
  };

// fill in selected options
async function init() {
	var maxTabs = await LS.getItem('maxTabs');
	var discardCriterion = await LS.getItem('discardCriterion');
	var ignorePinned = await LS.getItem('ignorePinned');
	var showCount = await LS.getItem('showCount');
	
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
	LS.setItem('maxTabs', document.getElementById("maxTabs").value);
	LS.setItem('discardCriterion', document.getElementById("discardCriterion").value);
	LS.setItem('ignorePinned', document.getElementById("ignorePinned").value);
	LS.setItem('showCount', document.getElementById("showCount").value);
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
