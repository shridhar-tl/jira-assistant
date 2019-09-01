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
        let url = "https://www.youtube.com/embed/f2aBSXzbYuA?rel=0&autoplay=1&showinfo=0&cc_load_policy=1&start=";
        let hash = document.location.hash.substring(2);
        hash = hash.substring(hash.indexOf('/'));
        const route = hash;
        let startAt = 0;
        const endAt = 0;
        switch (route) {
            case "/":
            default:
                startAt = 74;
                break;
            case "/calendar":
                startAt = 290;
                break;
            case "/reports/userdaywise":
                startAt = 538;
                break;
            case "/reports/customgrouped":
                startAt = 713;
                break;
            case "/settings":
                startAt = 1069;
                break;
            case "/feedback":
                startAt = 1147;
                break;
        }
        url += `${startAt}&end=${endAt}`;
        return url;
    }

    render() {
        return super.renderBase(<iframe src={this.url} id="ifVideoHelp" title="Video Help" style={{ width: '87vw', height: '95vh' }} frameBorder={0} allowFullScreen />);
    }
}

export default YoutubeVideo;