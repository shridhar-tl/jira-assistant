import { getOriginFromUrl } from '../utils/helpers';

class BrowserBase {
    static availableMethods =
        'getCurrentUrl,getCurrentTab,hasPermission,requestPermission,getPermissionObj,' +
        'replaceTabUrl,getAuthToken,getRedirectUrl,getLaunchUrl,' +
        'launchWebAuthFlow,removeAuthToken,extractAccessToken';

    async requestPermission(permissions: any, ...urls: string[]): Promise<boolean> {
        return true;
    }

    getPermissionObj(permissions: string[] | null | undefined, ...urls: string[]): any {
        const perms = permissions || ['tabs'];

        const result: any = { permissions: perms };

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

    persistBackground(persist: boolean): void {
        /* Do nothing */
    }

    connectAndKeepAlive(): void {
        /* Do nothing */
    }
}

export default BrowserBase;
