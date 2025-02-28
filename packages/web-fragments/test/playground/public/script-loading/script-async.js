document.getElementById('external-script-async-running').checked = true;
if (window.parent !== window && window.SCRIPT_CONTEXT_MARKER === '🔥') {
	document.getElementById('external-script-async-reframed').checked = true;
}
if (document.querySelector('script#external-script-async') === document.currentScript) {
	document.getElementById('external-script-async-currentScript').checked = true;
}
window.SCRIPT_COUNTER++;
