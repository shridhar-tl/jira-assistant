const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('_executeJASvc', async function (extnId, { svcName, action, args }, responder, reject) {
    //console.log('Communication received:', extnId, svcName, action, args, responder, reject);
    try {
        let response = ipcRenderer.invoke(svcName, action, args);
        if (typeof response === 'object' && typeof response.then === 'function') {
            response = await response;
        }
        //console.log('response from renderer', response);
        responder(response);
    }
    catch (err) {
        reject(err);
    }
});