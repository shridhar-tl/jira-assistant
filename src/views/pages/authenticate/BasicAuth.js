import React, { PureComponent } from 'react';
import { inject } from '../../../services';
import { Button, TextBox } from '../../../controls';
import { getOriginFromUrl } from '../../../common/utils';
import Dialog from '../../../dialogs';
import { executeService } from '../../../common/proxy';
import { ApiTokenHelpPage } from '../../../constants/urls';
import registerServices from '../../../services';
import Footer from '../Footer';
import { isExtnBuild } from '../../../constants/build-info';
import { withRouter } from '../../../pollyfills';

const isQuickView = document.location.href.indexOf('?quick=true') > -1;
const containerStyle = isQuickView ? { minHeight: '380px', maxHeight: '380px' } : {};

class Integrate extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "MessageService", "AppBrowserService", "SessionService", "JiraAuthService");
        this.state = {};
        this.useExtn = props.match.params?.store === '1';
        if (!this.useExtn) {
            registerServices('2');
        }
    }

    integrate = () => {
        const root = this.state.jiraUrl.trim().clearEnd('/').clearEnd('\\');
        this.tryIntegrate(root);
    };

    async tryIntegrate(root) {
        this.setState({ jiraUrl: root });
        this.$session.rootUrl = root;
        this.setState({ isLoading: true });
        const { userId, password } = this.state;

        this.$jAuth.integrateWithCred(root, userId, password).then(this.openDashboard
            , (response) => {
                response = response || {};
                if (response.status === 401) {
                    this.$message.warning("You are not authenticated with Jira to integrate. Please verify your credentials.", "Unauthorized");
                } else {
                    const origin = getOriginFromUrl(root)?.clearEnd('/');
                    if (origin && origin !== root) {
                        Dialog.yesNo(`"${root}" is not a valid Jira Api base path. Would you like to try with "${origin}" instead?`, "Change URL").then(() => {
                            this.tryIntegrate(origin);
                        });
                    } else {
                        this.$message.error("This is not a valid Jira server url or the server does not respond.", "Unknown server");
                    }
                }
            })
            .then(() => this.setState({ isLoading: false }));
    }

    openDashboard = async (id) => {
        if (id <= 0) {
            return;
        }

        // This block is to apply content scripts immediately to new Jira Instance
        try {
            await executeService('SELF', 'RELOAD', [], this.$message);
        } catch (err) {
            console.error('Unable to reload BG Listeners', err);
        }

        if (this.props.setAuthType) {
            this.props.setAuthType(this.useExtn ? '1' : '2');
        } else if (isExtnBuild) {
            this.$jaBrowserExtn.openTab("/index.html");
            window.close();
        } else {
            window.location.href = '/index.html';
        }
    };

    render() {
        const { jiraUrl, userId, password, isLoading } = this.state;

        return (
            <div className="app flex-row align-items-center" style={containerStyle}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 no-padding no-margin" style={{ maxWidth: 480, minWidth: 460 }}>
                            <div className="card mx-4 no-padding no-margin">
                                <div className="card-body p-4">
                                    <h1>Jira Assistant</h1>
                                    <p className="text-muted"><strong>Integrate</strong> with your Jira account</p>
                                    <div className="input-group mb-3">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text"><i className="fa fa-external-link" /></span>
                                        </div>
                                        <TextBox className="form-control" value={jiraUrl} onChange={(val) => this.setState({ jiraUrl: val })}
                                            placeholder="Jira root url (eg: https://jira.example.com)" />
                                    </div>
                                    <div className="input-group mb-3">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text"><i className="fa fa-user" /></span>
                                        </div>
                                        <TextBox className="form-control" value={userId} onChange={(val) => this.setState({ userId: val })}
                                            placeholder="Your Jira login id" />
                                    </div>
                                    <div className="input-group mb-3">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text"><i className="fa fa-lock" /></span>
                                        </div>
                                        <TextBox type="password" className="form-control" value={password} onChange={(val) => this.setState({ password: val })}
                                            placeholder="Password / Rest API Token" />
                                    </div>
                                    <p className="text-muted">
                                        <strong>Note:</strong> Credentials are stored in browser's cache storage. Use Jira Rest Api Token instead of password
                                        for better security. Learn more about <a href={ApiTokenHelpPage} target="_blank" rel="noreferrer">Rest Api Tokens</a>.
                                    </p>
                                    <Button type="success" className="btn-block" icon={isLoading ? "fa fa-spinner fa-spin" : "fa fa-unlock-alt"} disabled={!jiraUrl || isLoading}
                                        onClick={this.integrate} label="Integrate" />
                                </div>
                                <Footer />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(Integrate);