function getOriginFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.host}/*`;
    } catch {
        return url;
    }
}

export interface ContentScriptFiles {
    js: string[];
    css?: string[];
    pageJs?: string[];
}

export interface RegisteredContentScript {
    id: string;
    js: string[];
    css?: string[];
    matches: string[];
    runAt: 'document_start' | 'document_end' | 'document_idle';
    allFrames: boolean;
    world?: 'ISOLATED' | 'MAIN';
    persistAcrossSessions?: boolean;
}

export interface PermissionObj {
    permissions: string[];
    origins?: string[];
}

class BrowserBase {
    static availableMethods =
        'getCurrentUrl,getCurrentTab,hasPermission,requestPermission,getPermissionObj,' +
        'replaceTabUrl,getAuthToken,getRedirectUrl,getLaunchUrl,' +
        'launchWebAuthFlow,removeAuthToken,extractAccessToken';

    async requestPermission(_permissions: any, ..._urls: string[]): Promise<boolean> {
        return true;
    }

    getPermissionObj(permissions?: string[] | null, ...urls: string[]): PermissionObj {
        const result: PermissionObj = { permissions: permissions ?? ['tabs'] };

        if (urls.length) {
            result.origins = urls.map(getOriginFromUrl);
        }

        return result;
    }

    async hasPermission(_permissions: any): Promise<boolean> {
        return true;
    }

    async getLaunchUrl(_file: string): Promise<string> {
        return '';
    }

    persistBackground(_persist: boolean): void {}
    connectAndKeepAlive(): void {}
}

export default BrowserBase;
