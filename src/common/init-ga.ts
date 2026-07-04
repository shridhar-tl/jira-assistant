import { AnalyticsTrackingId } from '../constants/common';

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

window.dataLayer = window.dataLayer || [];
window.gtag = gtag;

function gtag(...args: any[]): void {
    window.dataLayer.push(args);
}

gtag('js', new Date());
gtag('config', AnalyticsTrackingId);
