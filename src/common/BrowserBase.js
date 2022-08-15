import { getOriginFromUrl } from '../common/utils';

class BrowserBase {
    // This class gets proxied when accessed as webapp
    // When new method is added or method name is changed in this class, this list has to be updated with the method name
    static availableMethods = "getCurrentUrl,getCurrentTab,hasPermission,requestPermission,getPermissionObj,"
        + "replaceTabUrl,getAuthToken,getRedirectUrl,getLaunchUrl," // getStorage,openTab is not required as this has to be implemented by proxy
        + "launchWebAuthFlow,removeAuthTokken,getStoreUrl,extractAccessToken";
    async requestPermission() {
        return true;
    }

    getPermissionObj(permissions, ...urls) {
        if (!permissions) {
            permissions = ['tabs'];
        }

        const result = { permissions };

        if (urls && urls.length) {
            result.origins = urls.map(getOriginFromUrl);
        }

        return result;
    }

    async hasPermission() {
        return true;
    }

    async getLaunchUrl() { return ''; }
}

export default BrowserBase;