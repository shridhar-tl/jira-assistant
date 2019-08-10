import React, { PureComponent } from 'react';
import "./P401.scss";

class Page401 extends PureComponent {
    componentWillMount() {
        document.body.style.backgroundColor = "#667380";
    }

    render() {
        var { jiraUrl } = this.props;

        return (
            <div className="error-card global">
                <div className="error-title-block">
                    <h1 className="error-title">401</h1>
                    <h2 className="error-sub-title"> Unauthenticated!</h2>
                </div>
                <div className="error-container visible">
                    <p>You are not authenticated in Jira. Before you start using Jira Assistant, please login to your Jira server. Once logged in you can go back to dashboard.</p>
                    <a className="btn btn-primary" href="index.html">
                        <i className="fa fa-angle-left"></i> Back to Dashboard</a>
                    <a className="btn btn-success pull-right" href={jiraUrl} target="_blank">
                        <i className="fa fa-external-link"></i> Open Jira url</a>
                </div>
            </div>
        );
    }
}

export default Page401;