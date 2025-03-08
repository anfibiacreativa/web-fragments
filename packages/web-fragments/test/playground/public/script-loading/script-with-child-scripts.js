const div = document.createElement('div');
const s1 = document.createElement('script');
s1.id = 'inline-child-script-sync';
s1.textContent = `
  document.getElementById('inline-child-script-sync-running').checked = true;
  if (window.parent !== window && window.SCRIPT_CONTEXT_MARKER === '🔥') {
    document.getElementById('inline-child-script-sync-reframed').checked = true;
  }
  window.SCRIPT_COUNTER++;
  if (document.querySelector('script#inline-child-script-sync') === document.currentScript) {
    document.getElementById('inline-child-script-sync-currentScript').checked = true;
  }
`;
const s2 = document.createElement('script');
s2.id = 'external-child-script-sync';
s2.src = '/script-loading/child-script-sync.js';
div.appendChild(s1);
div.appendChild(s2);
document.querySelector('article').appendChild(div);
