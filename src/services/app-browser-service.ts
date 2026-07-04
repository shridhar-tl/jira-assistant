import { BROWSER_NAME } from '@/common/browsers';
import { CHROME_WS_URL, StoreUrls } from '@/constants';

export default class AppBrowserService {
    static dependencies = [] as string[];

    async requestPermission(permissions: any, ...url: string[]): Promise<boolean> {
        // For web builds, permissions are not required
        // For browser extensions, this will be implemented properly
        return true;
    }

    getCurrentUrl(): Promise<string> {
        if (typeof window !== 'undefined') {
            return Promise.resolve(window.location.href);
        }
        return Promise.resolve('');
    }

    openTab(url: string, name?: string, opts?: string): void {
        if (typeof window !== 'undefined') {
            window.open(url, name, opts);
        }
    }

    getAuthToken(options: any): Promise<string | null> {
        return Promise.resolve(null);
    }

    removeAuthToken(token: string): Promise<void> {
        return Promise.resolve();
    }

    getStoreUrl(forRating?: boolean): string {
        return StoreUrls[BROWSER_NAME] || CHROME_WS_URL;
    }

    async getLaunchUrl(file: string): Promise<string> {
        return '';
    }

    connectAndKeepAlive(callback?: () => void): void {
        // For browser extensions, this keeps the background service worker alive
    }
}
