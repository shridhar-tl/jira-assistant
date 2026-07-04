import { AnalyticsTrackingId, AnalyticsUrl, AppVersionNo, isWebBuild } from '@/constants';

import { prepareUrlWithQueryString } from '@utils/helpers';

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

    constructor() {
        this.gtag = function () {};
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
                } catch (e) {
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
        } catch (e) {
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
