import React, { PureComponent } from 'react';
import { showContextMenu, ContextMenu } from 'jsd-report';
import { inject } from '../../../services';
import { Button, TextBox } from '../../../controls';
import { ContactUsUrl } from '../../../constants/urls';
import { ApiUrls } from '../../../constants/api-urls';
import BackupImporter from '../../../layouts/DefaultLayout/BackupImporter';
import { getJiraCloudOAuthAuthorizeUrl } from '../../../constants/oauth';
import { getOriginFromUrl } from '../../../common/utils';
import Dialog, { CustomDialog } from '../../../dialogs';
import { AppVersionNo } from '../../../constants/common';
import { executeService } from '../../../common/proxy';

const settingsIconStyles = {
    fontSize: '18px', position: 'absolute', right: '20px', top: '35px', color: '#0000ff'
};

const isQuickView = document.location.href.indexOf('?quick=true') > -1;
const containerStyle = isQuickView ? { minHeight: '380px', maxHeight: '380px' } : {};

class Integrate extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "AjaxService", "StorageService", "MessageService", "SettingsService", "AppBrowserService", "SessionService", "SettingsService", "UserService");

        this.year = new Date().getFullYear();

        this.browser = navigator.userAgent;
        this.state = { version: AppVersionNo };
        this.init();
    }

    async init() {
        this.settingsMenu = [
            { label: "Import Settings", icon: 'fa fa-upload fs-16 margin-r-5', command: this.importBackup.bind(this) },
            { label: "Options", icon: 'fa fa-cogs fs-16 margin-r-5', command: this.launchOptionsPage.bind(this) },
            { separator: true },
            { label: "Use Jira OAuth", icon: 'fa fa-external-link fs-16 margin-r-5', command: this.useOAuth.bind(this) },
        ];

        this.$jaBrowserExtn.getCurrentUrl().then((url) => {
            const root = this.getJiraRootUrl(url);
            if (root && root.length > 20 && root.startsWith('http')) {
                this.setState({ jiraUrl: root });
            }
        });
    }

    launchOptionsPage() {
        window.open('/index.html#/options');
    }

    importBackup() {
        if (this.importSettings) {
            this.importSettings();
        }
    }

    useOAuth() {
        const url = getJiraCloudOAuthAuthorizeUrl({
            forWeb: false,
            authType: '2'
        });
        window.open(url, 'JAOAuth2Win');
        window.close();
    }

    showMenu = (e) => showContextMenu(e, this.settingsMenu);
    setUploader = (a) => {
        // This need to be with curly braces to return undefined
        this.importSettings = a;
    };

    getJiraRootUrl(url) {
        return url.replace(/^(.*\/\/[^/?#]*).*$/, "$1");
    }

    integrate = () => {
        const root = this.state.jiraUrl.trim().clearEnd('/').clearEnd('\\');
        this.tryIntegrate(root);
    };

    async tryIntegrate(root) {
        this.setState({ jiraUrl: root });
        this.$session.rootUrl = root;
        this.setState({ isLoading: true });
        const hasPermission = await this.$jaBrowserExtn.requestPermission(null, root);
        this.$ajax.get(ApiUrls.mySelf)
            .then(data => this.$user.createUser(data, root).then(this.openDashboard, this.handleDBError)
                , (response) => {
                    response = response || {};
                    if (response.status === 401) {
                        this.$message.warning("You are not authenticated with Jira to integrate.", "Unauthorized");
                    }
                    else {
                        const origin = getOriginFromUrl(root)?.clearEnd('/');
                        if (origin && origin !== root) {
                            Dialog.yesNo(`"${root}" is not a valid Jira Api base path. Would you like to try with "${origin}" instead?`, "Change URL").then(() => {
                                this.tryIntegrate(origin);
                            });
                        } else {
                            if (!hasPermission) {
                                let msg = 'Permission denied to access this Url. ';
                                if (this.props.isWebBuild) {
                                    msg += "Try integrating directly from extension using JA icon or manually grant permission and retry.";
                                } else {
                                    msg += 'Manually grant permission and then retry. For more details, visit #214 in GitHub issue tracker.';
                                }

                                this.$message.error(msg, "Permission Denied");
                            } else {
                                this.$message.error("This is not a valid Jira server url or the server does not respond.", "Unknown server");
                            }
                        }
                    }
                })
            .then(() => this.setState({ isLoading: false }));
    }

    handleDBError = (err) => {
        this.$message.error("Unable to save the changes. Verify if you have sufficient free space in your drive", "Allocation failed");
        return -1;
    };

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

        await this.$settings.set("CurrentJiraUrl", this.state.jiraUrl);
        await this.$settings.set("CurrentUserId", id);
        if (this.props.setAuthType) {
            this.props.setAuthType('1');
        } else {
            this.$jaBrowserExtn.openTab("/index.html");
            window.close();
        }
    };

    onSettingsImport = () => {
        if (this.props.isWebBuild) {
            this.props.setAuthType('1');
        } else {
            document.location.href = '/index.html';
        }
    };

    render() {
        const { integrate, version, browser, state: { jiraUrl, isLoading } } = this;

        return (
            <div className="app flex-row align-items-center" style={containerStyle}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 no-padding no-margin" style={{ maxWidth: 480, minWidth: 460 }}>
                            <div className="card mx-4 no-padding no-margin">
                                <div className="card-body p-4">
                                    <BackupImporter onImport={this.onSettingsImport} cleanImport={true}>{this.setUploader}</BackupImporter>
                                    <ContextMenu />
                                    <span className="fa fa-cogs pull-right pointer" style={settingsIconStyles} onClick={this.showMenu} onContextMenu={this.showMenu} />
                                    <h1>Jira Assistant</h1>
                                    <p className="text-muted"><strong>Integrate</strong> with your Jira account</p>
                                    <div className="input-group mb-3">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text"><i className="fa fa-external-link" /></span>
                                        </div>
                                        <TextBox className="form-control" value={jiraUrl} onChange={(val) => this.setState({ jiraUrl: val })}
                                            placeholder="Jira root url (eg: https://jira.example.com)" />
                                    </div>
                                    <p className="text-muted">
                                        Login to your Jira in current tab or provide the Url of your Jira server to integrate.
                                        Ensure you have already been authenticated in Jira before you click on Integrate button.
                                    </p>
                                    <Button type="success" className="btn-block" icon={isLoading ? "fa fa-spinner fa-spin" : "fa fa-unlock-alt"} disabled={!jiraUrl || isLoading}
                                        onClick={integrate} label="Integrate" />
                                </div>
                                <div className="card-footer p-4">
                                    <div className="row">
                                        <div className="col-6">
                                            <span>© 2016-{this.year} Jira Assistant</span>
                                        </div>
                                        <div className="col-6" style={{ textAlign: 'right' }}>
                                            <span>
                                                <i className="fa fa-youtube" />
                                                <a href="https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1" target="_blank" rel="noopener noreferrer"
                                                    title="Click to open YouTube video guiding you to setup Jira Assistant"> Help setup</a>
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
            </div>
        );
    }
}

export default Integrate;