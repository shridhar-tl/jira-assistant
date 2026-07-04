function getOriginFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.host}/*`;
    } catch {
        return url;
    }
}

interface PermissionObj {
    permissions: string[];
    origins?: string[];
}

class BrowserBase {
    static availableMethods =
        'getCurrentUrl,getCurrentTab,hasPermission,requestPermission,getPermissionObj,' +
        'replaceTabUrl,getAuthToken,getRedirectUrl,getLaunchUrl,' +
        'launchWebAuthFlow,removeAuthToken,extractAccessToken';

    async requestPermission(permissions: any, ...urls: string[]): Promise<boolean> {
        return true;
    }

    getPermissionObj(permissions?: string[], ...urls: string[]): PermissionObj {
        if (!permissions) {
            permissions = ['tabs'];
        }

        const result: PermissionObj = { permissions };

        if (urls && urls.length) {
            result.origins = urls.map(getOriginFromUrl);
        }

        return result;
    }

    async hasPermission(permissions: any): Promise<boolean> {
        return true;
    }

    async getLaunchUrl(file: string): Promise<string> {
        return '';
    }

    persistBackground(persist: boolean): void {}
    connectAndKeepAlive(): void {}
}

export default BrowserBase;
