/* global browser exportFunction */
function executeJASvc(extnId, request, resolve, reject) {
    browser.runtime.sendMessage(request)
        .then((res) => resolve(JSON.stringify(res)), reject);
}

console.log('JA Communication started');
exportFunction(executeJASvc, window, { defineAs: '_executeJASvc' });