document.getElementById('external-script-sync-running').checked = true;
if (window.parent !== window && window.SCRIPT_CONTEXT_MARKER === '🔥') {
	document.getElementById('external-script-sync-reframed').checked = true;
}
if (document.querySelector('script#external-script-sync') === document.currentScript) {
	document.getElementById('external-script-sync-currentScript').checked = true;
}
window.SCRIPT_COUNTER++;
