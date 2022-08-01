import { AnalyticsTrackingId } from "../constants/common";

window.dataLayer = window.dataLayer || [];
window.gtag = gtag;
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());

gtag('config', AnalyticsTrackingId);