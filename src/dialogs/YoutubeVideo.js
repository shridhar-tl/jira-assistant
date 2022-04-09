import React from 'react';
import BaseDialog from './BaseDialog';
import { EventCategory } from '../_constants';

const videoList = [
    { videoId: "xNYNXWUgCeA", module: "Dashboard", route: "dashboard" },
    { videoId: "TxNH1HQtiX0", module: "Worklog report", route: "userdaywise" },
    { videoId: "6hAOtUm1lUk", module: "Worklog import", route: "import/worklog" },
    { videoId: "EFgXFqrGuTI", module: "Issue import", route: "import/issue" },
    { videoId: "HMyBkaZ09Xw", module: "Report builder", route: "advanced" }
];

const oldVideoList = [
    { startAt: 290, videoId: "f2aBSXzbYuA", module: "Calendar", route: "calendar" },
    { startAt: 713, videoId: "f2aBSXzbYuA", module: "Custom report", route: "customgrouped" },
    { startAt: 1069, videoId: "f2aBSXzbYuA", module: "Settings", route: "settings" },
    { startAt: 1147, videoId: "f2aBSXzbYuA", module: "Feedback", route: "feedback" }
];

class YoutubeVideo extends BaseDialog {
    constructor(props) {
        super(props);
        this.style = { width: "87vw", height: "95vh" };
        this.className = "video-help";
        this.videoList = [...videoList];
        this.setVideoUrl();
    }

    setVideoUrl() {
        const route = document.location.hash.substring(2);

        let videoDetails = videoList.first((video) => ~route.indexOf(video.route));

        if (!videoDetails) {
            videoDetails = oldVideoList.first((video) => ~route.indexOf(video.route));

            if (!videoDetails) {
                videoDetails = oldVideoList[0];
            }

            this.videoList.push(videoDetails);
        }

        this.state.url = this.getVideoUrl(videoDetails);
        this.state.index = this.videoList.indexOf(videoDetails);
    }

    getVideoUrl(video, event) {
        this.$analytics.trackEvent(event || "Video help viewed", EventCategory.HeaderActions, `Video Help: ${video.module}`);

        return `https://www.youtube.com/embed/${video.videoId}?rel=0&autoplay=1&showinfo=0&cc_load_policy=1&start=${video.startAt || 0}`; // &end=${endAt}
    }

    playPrev = () => {
        let { index } = this.state;
        index -= 1;
        const url = this.getVideoUrl(this.videoList[index], "Video view previous");

        this.setState({ url, index });
    };

    playNext = () => {
        let { index } = this.state;
        index += 1;
        const url = this.getVideoUrl(this.videoList[index], "Video view next");

        this.setState({ url, index });
    };

    render() {
        const { url, index } = this.state;

        return super.renderBase(<div className="video-help">
            {index > 0 && <div className="nav-icon left" onClick={this.playPrev}><span className="fa fa-angle-left" title="Play previous video" /></div>}
            <iframe src={url} id="ifVideoHelp" title="Video Help" style={{ width: '87vw', height: '95vh' }} frameBorder={0} allowFullScreen />
            {(index + 1) < this.videoList.length && <div className="nav-icon right" onClick={this.playNext}><span className="fa fa-angle-right" title="Play next video" /></div>}
        </div>);
    }
}

export default YoutubeVideo;