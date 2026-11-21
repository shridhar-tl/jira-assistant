import { AnalyticsTrackingId, AnalyticsUrl, AppVersionNo, isWebBuild } from '@/constants';

import { prepareUrlWithQueryString } from '@utils/helpers';

interface ExtensionPermissionEvent {
    addListener(callback: () => void): void;
}

interface ExtensionPermissionsApi {
    getAll(): Promise<{ data_collection?: string[] }>;
    onAdded?: ExtensionPermissionEvent;
    onRemoved?: ExtensionPermissionEvent;
}

declare const browser: { permissions?: ExtensionPermissionsApi } | undefined;

const analyticsDataCollection = 'technicalAndInteraction';

function getExtensionPermissionsApi(): ExtensionPermissionsApi | undefined {
    return typeof browser !== 'undefined' && typeof browser?.permissions?.getAll === 'function' ? browser.permissions : undefined;
}

// Firefox 140+ reports the built-in data collection consent via permissions.getAll().data_collection.
// Browsers without this key have no such consent, so the in-app analytics setting alone applies.
async function hasDataCollectionConsent(permissionsApi: ExtensionPermissionsApi): Promise<boolean> {
    try {
        const { data_collection } = await permissionsApi.getAll();
        return !data_collection || data_collection.includes(analyticsDataCollection);
    } catch {
        return false;
    }
}

function removeImageOnLoad(this: HTMLImageElement): void {
    this.remove();
}

function getVirtualUrl(versionNo: number, path: string): string {
    const url = new URL(document.location.href);
    const origin = url.protocol.startsWith('http') ? url.origin : `v${versionNo}`;
    return `${origin}${path}${url.search}`;
}

export default class AnalyticsService {
    private enableLogging = true;
    private enableExceptionLogging = true;
    private JAInstId?: string;
    private currentPage?: string;
    private gtag: (...args: any[]) => void;
    private dataCollectionConsent: Promise<boolean> = Promise.resolve(true);

    constructor() {
        this.gtag = function () {};

        const permissionsApi = getExtensionPermissionsApi();
        if (permissionsApi) {
            const refreshConsent = () => {
                this.dataCollectionConsent = hasDataCollectionConsent(permissionsApi);
            };
            refreshConsent();
            permissionsApi.onAdded?.addListener(refreshConsent);
            permissionsApi.onRemoved?.addListener(refreshConsent);
        }
    }

    send(obj: Record<string, any>): void {
        const origin = document.location.origin;
        const { availHeight, availWidth, height, width, pixelDepth } = window.screen;

        const data = {
            v: 2,
            tid: AnalyticsTrackingId,
            uid: this.JAInstId,
            _p: Math.round(2147483647 * Math.random()),
            cid: this.JAInstId,
            ul: navigator?.language?.toLowerCase(),
            sr: `${availWidth}x${availHeight}`,
            _s: 1,
            sid: new Date().getTime(),
            dl: origin,
            dt: document.title,
            en: 'page_view',
            _ee: 1,
            vp: `${width}x${height}`,
            sd: `${pixelDepth}-bit`,
            ...this.getPageView(this.currentPage || ''),
            ...obj,
        };

        const url = prepareUrlWithQueryString(AnalyticsUrl, data);
        void this.dataCollectionConsent.then((granted) => {
            if (granted) {
                this.dispatch(url);
            }
        });
    }

    private dispatch(url: string): void {
        if (typeof document !== 'undefined') {
            const imgTag = document.createElement('img');
            imgTag.onload = removeImageOnLoad as any;
            imgTag.onerror = removeImageOnLoad as any;
            imgTag.width = 1;
            imgTag.height = 1;
            imgTag.src = url;
            document.body.append(imgTag);
        } else {
            console.log('Analytics not hit:', url);
        }
    }

    getPageView(path: string): Record<string, any> {
        return { t: 'pageview', dp: path, dl: path };
    }

    getEventObject(category: string, action: string, label?: string, value?: number): Record<string, any> {
        const obj: Record<string, any> = {
            en: category,
            'ep.event': action,
            _et: new Date().getTime(),
        };
        if (label) {
            obj['ep.label'] = label;
        }
        if (value) {
            obj['ep.value'] = value;
        }
        return obj;
    }

    setIfEnabled(enableLogging: boolean, enableException: boolean): void {
        this.enableLogging = enableLogging;
        this.enableExceptionLogging = enableException;
    }

    setUserId(uid?: string): void {
        if (uid) {
            this.JAInstId = uid;
            this.gtag('set', 'userId', uid);
        }
    }

    trackEvent(event: string, category: string, label?: string, value?: number): void {
        if (!this.enableLogging) {
            return;
        }

        label = label || this.getCurrentRouteUrl();

        this.gtag('event', category, { event, label, value });
        this.send(this.getEventObject(category, event, label, value));
    }

    trackError(err: any, fatal?: boolean): void {
        if (!this.enableExceptionLogging) {
            return;
        }

        const exd = this.getExceptionDetails(err);

        this.gtag('event', 'exception', {
            description: exd,
            fatal: fatal || false,
        });

        this.send({ en: 'exception', 'ep.description': exd, 'ep.fatal': fatal ? 'true' : 'false' });
    }

    getExceptionDetails(err: any): string {
        if (err) {
            if (typeof err === 'object') {
                if (err.promise && err.reason) {
                    const { status, response, error } = err.reason;
                    err = { status, response, error };
                }

                try {
                    return JSON.stringify(err);
                } catch {
                    return this.searilizeObj(err);
                }
            } else {
                return this.searilizeObj(err);
            }
        } else {
            return `Error occured:- ${typeof err}`;
        }
    }

    searilizeObj(obj: any, depth?: number): any {
        depth = depth || 0;

        try {
            const result = Object.keys(obj).reduce((res: any, key) => {
                let val = obj[key];
                if (typeof val === 'object') {
                    if (key.startsWith('_') || depth! > 0) {
                        return res;
                    }
                    val = this.searilizeObj(val, depth! + 1);
                }

                res[key] = val;
                return res;
            }, {} as any);

            if (!depth) {
                return JSON.stringify(result);
            } else {
                return result;
            }
        } catch {
            return 'Unknown error: Unable to searilize';
        }
    }

    getCurrentRouteUrl(): string {
        let page = (isWebBuild ? document.location.pathname : document.location.hash).substring(1);
        if (isWebBuild && !page) {
            page = document.location.hash;
        }

        if (page === '/') {
            page = '/dashboard';
        }

        return page;
    }

    trackPageView(page?: string): void {
        if (!this.enableLogging) {
            return;
        }

        if (!page) {
            page = this.getCurrentRouteUrl();
        }

        try {
            const parts = page.split('/');
            if (!isNaN(parseInt(parts[1]))) {
                page = page.substring(parts[1].length + 1);
            }
        } catch (e) {
            console.error('Error tracking', e);
        }

        page = getVirtualUrl(AppVersionNo, page);
        this.currentPage = page;

        this.gtag('set', 'page', page);
        this.gtag('send', 'pageview', page);
        this.send(this.getPageView(page));
    }
}
