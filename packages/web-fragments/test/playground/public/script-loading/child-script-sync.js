document.getElementById('external-child-script-sync-running').checked = true;
if (window.parent !== window && window.SCRIPT_CONTEXT_MARKER === '🔥') {
	document.getElementById('external-child-script-sync-reframed').checked = true;
}
if (document.querySelector('script#external-child-script-sync') === document.currentScript) {
	document.getElementById('external-child-script-sync-currentScript').checked = true;
}
window.SCRIPT_COUNTER++;
