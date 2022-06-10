import React, { PureComponent } from 'react';
import { inject } from '../../../services';
import { getGitHubIssueUrl } from '../../../_constants';
import "./P401.scss";

class Page401 extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "AppBrowserService");
        this.state = { hasPermission: !!props.jiraUrl };
        document.body.style.backgroundColor = "#667380";
    }

    async componentDidMount() {
        const jiraUrl = this.props.jiraUrl;
        if (jiraUrl) {
            const hasPermission = await this.$jaBrowserExtn.requestPermission(null, jiraUrl);
            this.setState({ hasPermission });
        }
    }

    grantPermission = async () => {
        const jiraUrl = this.props.jiraUrl;
        const hasPermission = await this.$jaBrowserExtn.requestPermission(null, jiraUrl);
        if (hasPermission) {
            document.location.href = "/index.html";
        }
    };

    render() {
        const { jiraUrl } = this.props;
        const { hasPermission } = this.state;

        const issueLink = (<a className="link badge badge-warning"
            style={{ fontWeight: 'bold' }}
            href={getGitHubIssueUrl(214)} target="_blank" rel="noopener noreferrer">#214</a>);

        return (
            <div className="error-card global">
                <div className="error-title-block">
                    <h1 className="error-title">401</h1>
                    <h2 className="error-sub-title"> Unauthenticated!</h2>
                </div>
                <div className="error-container visible">
                    {hasPermission && <p>You are not authenticated in Jira. Before you start using Jira Assistant, please login to Jira.
                        Once logged in you can go back to dashboard.
                        If issue persists, please visit {issueLink} for more details.
                    </p>}
                    {!hasPermission && <p>
                        Extension is not granted permission to access "{jiraUrl}".
                        Please grant permission before trying to access it.
                        More details available in issue {issueLink}</p>}
                    <a className="btn btn-primary margin-r-5" href="index.html">
                        <i className="fa fa-angle-left"></i> Dashboard</a>
                    {!hasPermission && <button className="btn btn-warning" onClick={this.grantPermission}>
                        <i className="fa fa-unlock"></i> Grant permission</button>}
                    <a className="btn btn-success pull-right" href={jiraUrl} target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-external-link"></i> Open Jira</a>
                </div>
            </div>
        );
    }
}

export default Page401;