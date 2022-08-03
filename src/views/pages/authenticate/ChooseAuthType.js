import classNames from 'classnames';
import React, { PureComponent } from 'react';
import Dialog, { CustomDialog } from '../../../dialogs';
import { BROWSER_NAME } from '../../../common/browsers';
import { ContactUsUrl, StoreUrls, WebSiteUrl } from '../../../constants/urls';
import './ChooseAuthType.scss';
import { getJiraCloudOAuthAuthorizeUrl } from '../../../constants/oauth';

class ChooseAuthType extends PureComponent {
    constructor(props) {
        super(props);
        this.storeUrl = StoreUrls[BROWSER_NAME] || WebSiteUrl;
        this.state = {};
    }

    getExtensionMessage() {
        const { isExtnValid, extnUnavailable, needIntegration } = this.props;

        if (extnUnavailable) {
            return (<div className="auth-type-desc">Please install Jira Assistant extension and ensure it is enabled.
                If you believe latest version is already installed and enabled, then please ensure service worker is running in the extension.</div>);
        } else if (!isExtnValid) {
            return (<div className="auth-type-desc">You are using old version of Jira Assistant extension.
                Some of the features are not supported until you update your extension to latest version. Please update the extension and refresh this page.</div>);
        } else if (needIntegration) {
            return (<div className="auth-type-desc">Required version of extension is already installed but you haven't yet integrated with Jira.
                Please click on the JA icon in your browser to integrate with Jira. Then refresh this page again.</div>);
        } else {
            return (<div className="auth-type-desc">Required version of extension is already installed and ready to use.
                Select this option to use Jira Assistant with latest features and bug fixes not yet available in the extension.</div>);
        }
    }

    navigateToStore = () => window.open(this.storeUrl);

    extnSelected = () => this.props.onAuthTypeChosen('1');

    oAuthSelected = () => {
        Dialog.yesNo((<span>
            You will be redirected to Jira Cloud where you can Authorize Jira Assistant to access Jira API's.
            <br /><br />
            This is a one time activity and the authorization code would be stored in your browser cache which would be used in future for accessing Jira.
        </span>),
            "Jira Cloud - OAuth2 Integration").then(() => {
                document.location.href = getJiraCloudOAuthAuthorizeUrl({
                    forWeb: this.props.isWebBuild,
                    authType: '2'
                });
            });
    };

    render() {
        const { version, browser, props: { extnUnavailable, isExtnValid, needIntegration } } = this;
        const allowExtn = !extnUnavailable && isExtnValid && !needIntegration;

        return (
            <div className="app auth-page flex-row align-items-center">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 no-padding no-margin" style={{ maxWidth: 480, minWidth: 460 }}>
                            <div className="card mx-4 no-padding no-margin">
                                <div className="card-body p-4">
                                    <h1>Jira Assistant</h1>
                                    <p className="text-muted">Choose the way you would like to <strong>Integration</strong> with your Jira</p>
                                    {extnUnavailable && <span className="badge badge-success" onClick={this.navigateToStore} title="Click to visit webstore and install the extension">Install Extension</span>}
                                    {!extnUnavailable && !isExtnValid && !allowExtn && <span className="badge badge-success" onClick={this.navigateToStore} title="Click to visit webstore and update the extension">Update Extension</span>}
                                    <div className={classNames("auth-type", !allowExtn && "disabled")} onClick={allowExtn ? this.extnSelected : undefined}>
                                        <div className="auth-type-title">Use Jira Assistant Extension</div>
                                        {this.getExtensionMessage()}
                                    </div>
                                    <div className="auth-type" onClick={this.oAuthSelected}>
                                        <div className="auth-type-title">Use OAuth2 (Jira Cloud only)</div>
                                        <div className="auth-type-desc">Using OAuth option will let authorize this tool to Integrate with Jira without need to store credentials in this tool. This is more secured than using userid and password</div>
                                    </div>
                                    <div className="auth-type disabled">
                                        <div className="auth-type-title">Use User id and Password <span className="badge badge-warning">Comming Soon</span></div>
                                        <div className="auth-type-desc">You can use your user id and password to authenticate with Jira.
                                            On some cases this option may not work if you use single signon for logging in to Jira.</div>
                                    </div>
                                </div>
                                <div className="card-footer p-4">
                                    <div className="row">
                                        <div className="col-6">
                                            <span>© {this.year} Jira Assistant</span>
                                        </div>
                                        <div className="col-6" style={{ textAlign: 'right' }}>
                                            <span>
                                                <i className="fa fa-youtube" />
                                                <a href="https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1" target="_blank" rel="noopener noreferrer"
                                                    title="Click to open youtube video guiding you to setup Jira Assistant"> Help setup</a>
                                            </span> |
                                            <span>
                                                <i className="fa fa-phone margin-l-5" />
                                                <a href={`${ContactUsUrl}?entry.1426640786=${version}&entry.972533768=${browser}`}
                                                    target="_blank" rel="noopener noreferrer" title="Click to report about any issues or ask a question"> Contact us</a>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <CustomDialog />
            </div >
        );
    }
}

export default ChooseAuthType;

