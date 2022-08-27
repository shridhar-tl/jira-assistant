const { safeStorage } = require('electron');

module.exports = {
    encryptData: function (data) {
        return safeStorage.encryptString(data).toString('base64');
    },
    decryptData: function (data) {
        return safeStorage.decryptString(Buffer.from(data, 'base64'));
    },
};