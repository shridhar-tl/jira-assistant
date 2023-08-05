import React, { PureComponent } from 'react';
import { inject } from '../../../services';
import { getGitHubIssueUrl } from '../../../constants/utils';
import { isWebBuild, redirectToRoute } from '../../../constants/build-info';
import { Button } from '../../../controls';
import "./P401.scss";
import Link from '../../../controls/Link';

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
            redirectToRoute();
        }
    };

    render() {
        const { jiraUrl, validate } = this.props;
        const { hasPermission } = this.state;

        const issueLink = (<Link className="link badge badge-warning"
            style={{ fontWeight: 'bold' }}
            href={getGitHubIssueUrl(214)}>#214</Link>);

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
                        Please {isWebBuild ? 'open Jira Assist extension and ' : ''} grant permission before trying to access it.
                        More details available in issue {issueLink}</p>}
                    <Button className="margin-r-5" icon="fa fa-refresh" label="Try Again"
                        onClick={validate} style={{ height: 35 }} />
                    {!isWebBuild && !hasPermission && <button className="btn btn-warning" onClick={this.grantPermission}>
                        <i className="fa fa-unlock"></i> Grant permission</button>}
                    <Link className="p-button p-button-success p-button-xs float-end" href={jiraUrl}>
                        <i className="fa fa-external-link"></i> Open Jira</Link>
                </div>
            </div>
        );
    }
}

export default Page401;