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
            page = this.router.url;
        }
        if (page === "/") {
            page = "/dashboard";
        }
        //_gaq.push(['_trackPageView', $location.url()]);
        window['_gaq'].push(['_trackEvent', page, event]);
        //ga('send', 'pageview', $location.path());
    }

    trackPageView(page) {
        if (!page) {
            page = this.router.url;
        }
        if (page === "/") {
            page = "/dashboard";
        }
        window['_gaq'].push(['_trackPageview', "v" + this.versionNumber + "/index.html" + page]);
    }
}
