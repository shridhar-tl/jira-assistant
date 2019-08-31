export default class AnalyticsService {
    static dependencies = ["AppBrowserService"];

    // ToDo: implement router related changes
    constructor($jaBrowserExtn) {
        window['_gaq'] = window['_gaq'] || [];
        $jaBrowserExtn.getAppVersion().then((version) => {
            this.versionNumber = version || 0;
        }, () => this.versionNumber = 0);
    }

    trackEvent(event, page) {
        if (!page) {
            page = this.getCurrentRouteUrl();
        }

        //_gaq.push(['_trackPageView', $location.url()]);
        window['_gaq'].push(['_trackEvent', page, event]);
        //ga('send', 'pageview', $location.path());
    }

    getCurrentRouteUrl() {
        let page = document.location.hash.substring(1);

        if (page === "/") {
            page = "/dashboard";
        }

        return page;
    }

    trackPageView(page) {
        if (!page) {
            page = this.getCurrentRouteUrl();
        }

        window['_gaq'].push(['_trackPageview', `v${this.versionNumber}/index.html${page}`]);
    }
}
