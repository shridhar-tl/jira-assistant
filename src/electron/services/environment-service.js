module.exports = {
    hasPermission: async () => true,
    requestPermission: async () => true,
    registerContentScripts: async () => true,
    getAuthToken: async () => null, // Need to implement
    getRedirectUrl: async () => null, // Need to implement
    launchWebAuthFlow: async () => null, // Need to implement
    removeAuthTokken: async () => null, // Need to implement
    getStoreUrl: async () => 'https://www.jiraassistant.com', // Need to implement
    extractAccessToken: async () => null, // Need to implement
};