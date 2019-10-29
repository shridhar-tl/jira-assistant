import React from 'react';
import BaseDialog from './BaseDialog';

class YoutubeVideo extends BaseDialog {
    constructor(props) {
        super(props);
        this.style = { width: "87vw", height: "95vh" };
        this.className = "video-help";
        this.url = this.getUrl();
    }

    getUrl() {
        const route = document.location.hash.substring(2);
        let startAt = 0;
        //const endAt = 0;
        let videoId = "f2aBSXzbYuA";

        if (~route.indexOf("dashboard")) {
            videoId = "xNYNXWUgCeA";
        }
        else if (~route.indexOf("calendar")) {
            startAt = 290;
        }
        else if (~route.indexOf("userdaywise")) {
            videoId = "TxNH1HQtiX0";
        }
        else if (~route.indexOf("import/worklog")) {
            videoId = "6hAOtUm1lUk";
        }
        else if (~route.indexOf("advanced")) {
            videoId = "HMyBkaZ09Xw";
        }
        else if (~route.indexOf("customgrouped")) {
            startAt = 713;
        }
        else if (~route.indexOf("settings")) {
            startAt = 1069;
        }
        else if (~route.indexOf("feedback")) {
            startAt = 1147;
        }
        else {
            videoId = "xNYNXWUgCeA";
        }

        return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&showinfo=0&cc_load_policy=1&start=${startAt}`; // &end=${endAt}
    }

    render() {
        return super.renderBase(<iframe src={this.url} id="ifVideoHelp" title="Video Help" style={{ width: '87vw', height: '95vh' }} frameBorder={0} allowFullScreen />);
    }
}

export default YoutubeVideo;