class BrowserBase {
    // This class gets proxied when accessed as webapp
    // When new method is added or method name is changed in this class, this list has to be updated with the method name
    static availableMethods = "getCurrentUrl,getCurrentTab,hasPermission,requestPermission,getPermissionObj,"
        + "replaceTabUrl,getAuthToken,getRedirectUrl,getLaunchUrl," // getStorage,openTab is not required as this has to be implemented by proxy
        + "launchWebAuthFlow,removeAuthTokken,getStoreUrl,extractAccessToken";
    async requestPermission() {
        return true;
    }

    async hasPermission() {
        return true;
    }

    async getLaunchUrl() { return ''; }

    on(event, func) {
        if (!this.listeners) {
            this.listeners = {};
            this.listenForMessages();
        }

        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(func);
    }

    off() {
        this.clearListeners();
        delete this.listeners;
    }

    messageReceived = () => {
        //
    };
}

export default BrowserBase;