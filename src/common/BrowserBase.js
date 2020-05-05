class BrowserBase {
    async requestPermission() {
        return true;
    }

    async hasPermission() {
        return true;
    }
}

export default BrowserBase;