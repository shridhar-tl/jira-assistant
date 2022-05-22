class BrowserBase {
    async requestPermission() {
        return true;
    }

    async hasPermission() {
        return true;
    }

    async hasUpdates() {
        return false;
    }
}

export default BrowserBase;