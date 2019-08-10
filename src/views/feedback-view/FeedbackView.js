import React, { PureComponent } from 'react';
import { inject } from '../../services';

const style = { minWidth: 'calc(100% + 16px)', minHeight: '100%', marginLeft: '-8px', height: 1650, overflow: 'auto', border: 0 };

class FeedbackView extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "SessionService", "AppBrowserService");

        var cUser = this.$session.CurrentUser;
        this.$jaBrowserExtn.getAppVersion().then((version) => {
            var siteVersionNumber = (version || '0.58');
            this.feedbackUrl = cUser.feedbackUrl.format([cUser.displayName, cUser.emailAddress, siteVersionNumber, navigator.userAgent]);
        });
    }

    resizeIframe(obj) {
        setTimeout(function () {
            obj.style.height = 0;
            obj.style.height = (obj.contentWindow.document.body.scrollHeight + 30) + 'px';
        }, 2000);
    }

    render() {
        return (
            <iframe src={this.feedbackUrl} title="Feedback" style={style} />
        );
    }
}

export default FeedbackView;