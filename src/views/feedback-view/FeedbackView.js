import React, { PureComponent } from 'react';
import { inject } from '../../services';

const style = { minWidth: 'calc(100% + 16px)', minHeight: '100%', marginLeft: '-8px', height: 1650, overflow: 'auto', border: 0 };

class FeedbackView extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "SessionService", "AppBrowserService");
        this.state = {};
    }

    UNSAFE_componentWillMount() {
        const cUser = this.$session.CurrentUser;
        this.$jaBrowserExtn.getAppVersion().then((version) => {
            const siteVersionNumber = (version || '0.80');
            const feedbackUrl = cUser.feedbackUrl.format([cUser.displayName, cUser.emailAddress, siteVersionNumber, navigator.userAgent]);
            this.setState({ feedbackUrl });
        });
    }

    render() {
        return (
            <iframe src={this.state.feedbackUrl} title="Feedback" style={style} />
        );
    }
}

export default FeedbackView;