document.getElementById('external-script-defer-running').checked = true;
if (window.parent !== window && window.SCRIPT_CONTEXT_MARKER === '🔥') {
	document.getElementById('external-script-defer-reframed').checked = true;
}
if (document.querySelector('script#external-script-defer') === document.currentScript) {
	document.getElementById('external-script-defer-currentScript').checked = true;
}
window.SCRIPT_COUNTER++;
