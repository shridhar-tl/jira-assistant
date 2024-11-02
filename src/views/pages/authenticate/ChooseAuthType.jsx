import classNames from 'classnames';
import React, { PureComponent } from 'react';
import Dialog from '../../../dialogs';
import { BROWSER_NAME } from '../../../common/browsers';
import { StoreUrls, WebSiteUrl } from '../../../constants/urls';
import { getJiraCloudOAuthAuthorizeUrl } from '../../../constants/oauth';
import { buildMode, isAppBuild } from '../../../constants/build-info';
import Footer from '../Footer';
import { withRouter } from '../../../pollyfills';
import './ChooseAuthType.scss';

class ChooseAuthType extends PureComponent {
    constructor(props) {
        super(props);
        this.storeUrl = StoreUrls[BROWSER_NAME] || WebSiteUrl;
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
                Select this option to connect and integrate extension with Jira. Or, click JA icon in your browser to integrate with Jira first and then refresh this page again.</div>);
        } else {
            return (<div className="auth-type-desc">Required version of extension is already installed and ready to use.
                Select this option to connect with Jira Assistant extension and use latest features and bug fixes not yet available in the extension.</div>);
        }
    }

    navigateToStore = () => window.open(this.storeUrl);

    extnSelected = () => {
        if (this.props.needIntegration) {
            this.props.navigate('/integrate/extn');
        } else {
            this.props.onAuthTypeChosen('1');
        }
    };

    basicAuthSelected = () => this.props.navigate('/integrate/basic');

    oAuthSelected = () => {
        Dialog.yesNo((<span>
            You will be redirected to Jira Cloud where you can Authorize Jira Assistant to access Jira API's.
            <br /><br />
            This is a one time activity and the authorization code would be stored in your browser cache which would be used in future for accessing Jira.
        </span>),
            "Jira Cloud - OAuth2 Integration").then(() => {
                document.location.href = getJiraCloudOAuthAuthorizeUrl({
                    initSource: buildMode,
                    authType: '2'
                });
            });
    };

    getExtensionItem() {
        const { props: { extnUnavailable, isExtnValid } } = this;
        const allowExtn = !extnUnavailable && isExtnValid;

        return (<>
            {extnUnavailable && <span className="badge bg-success" onClick={this.navigateToStore} title="Click to visit webstore and install the extension">Install Extension</span>}
            {!extnUnavailable && !isExtnValid && !allowExtn && <span className="badge bg-success" onClick={this.navigateToStore} title="Click to visit webstore and update the extension">Update Extension</span>}
            <div className={classNames("auth-type", !allowExtn && "disabled")} onClick={allowExtn ? this.extnSelected : undefined} data-test-id="extn-auth">
                <div className="auth-type-title">Use Jira Assistant Extension</div>
                {this.getExtensionMessage()}
            </div>
        </>);
    }

    render() {
        return (
            <div className="app auth-page flex-row align-items-center">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 no-padding no-margin" style={{ maxWidth: 480, minWidth: 460 }}>
                            <div className="card mx-4 no-padding no-margin">
                                <div className="card-body p-4">
                                    <h1>Jira Assistant</h1>
                                    <p className="text-muted">Choose the way you would like to <strong>Integrate</strong> with your Jira</p>
                                    {!isAppBuild && this.getExtensionItem()}
                                    <div className="auth-type" onClick={this.oAuthSelected} data-test-id="o-auth">
                                        <div className="auth-type-title">Use OAuth2 (Jira Cloud only)</div>
                                        <div className="auth-type-desc">Using OAuth option will let authorize this tool to Integrate with Jira without need to store login credentials in this tool. This is more secured than using userid and password</div>
                                    </div>
                                    <div className="auth-type" onClick={this.basicAuthSelected} data-test-id="basic-auth">
                                        <div className="auth-type-title">Use User id and Password</div>
                                        <div className="auth-type-desc">You can use your user id and password / api token to authenticate with Jira.
                                            On some cases this option may not work if you use single sign-on for logging in to Jira.</div>
                                    </div>
                                </div>
                                <Footer />
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }
}

export default withRouter(ChooseAuthType);

