import React, { PureComponent } from 'react';
import { showContextMenu, ContextMenu } from '../../../externals/jsd-report';
import { inject } from '../../../services';
import { Button, TextBox } from '../../../controls';
import { ApiUrls } from '../../../constants/api-urls';
import BackupImporter from '../../../layouts/DefaultLayout/BackupImporter';
import { getJiraCloudOAuthAuthorizeUrl } from '../../../constants/oauth';
import { getOriginFromUrl } from '../../../common/utils';
import Dialog from '../../../dialogs';
import { executeService } from '../../../common/proxy';
import Footer from '../Footer';
import { withRouter } from '../../../pollyfills';
import { buildMode, isExtnBuild, isWebBuild, redirectToRoute } from '../../../constants/build-info';
import config from '../../../customize';

const settingsIconStyles = {
    fontSize: '18px', position: 'absolute', right: '20px', top: '35px', color: '#0000ff'
};

const isQuickView = document.location.href.indexOf('?quick=true') > -1;
const containerStyle = isQuickView ? { minHeight: '380px', maxHeight: '380px' } : {};

class Integrate extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "AjaxService", "StorageService", "MessageService", "SettingsService", "AppBrowserService", "SessionService", "SettingsService", "UserService");
        this.state = { jiraUrl: config.settings.defaultIntegratUrl || '' };
        this.init();
    }

    async init() {
        this.settingsMenu = [
            { label: "Import Settings", icon: 'fa fa-upload fs-16 margin-r-5', command: this.importBackup.bind(this) },
            { label: "Options", icon: 'fa fa-cogs fs-16 margin-r-5', command: this.launchOptionsPage.bind(this) },
            { separator: true },
            { label: "Use Jira OAuth", icon: 'fa fa-external-link fs-16 margin-r-5', command: this.useOAuth.bind(this) },
            { label: "Use Basic Auth", icon: 'fa fa-user fs-16 margin-r-5', command: () => this.props.navigate('/integrate/basic/1') }
        ];

        if (isExtnBuild) {
            if (!this.state.jiraUrl) {
                this.$jaBrowserExtn.getCurrentUrl().then((url) => {
                    const root = this.getJiraRootUrl(url);
                    if (root && root.length > 20 && root.startsWith('http')) {
                        this.setState({ jiraUrl: root });
                    }
                }, console.error);
            }
        }
    }

    launchOptionsPage() {
        this.$jaBrowserExtn.openTab(isWebBuild ? '/options' : '/index.html#/options');
    }

    importBackup() {
        if (this.importSettings) {
            this.importSettings();
        }
    }

    useOAuth() {
        const url = getJiraCloudOAuthAuthorizeUrl({
            initSource: buildMode,
            authType: '1'
        });

        if (isWebBuild || !isQuickView) {
            document.location.href = url;
        } else {
            this.$jaBrowserExtn.openTab(url, 'JAOAuth2Win');
            window.close();
        }
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
        // Session userId has to be cleared to avoid JiraAuthService from interfering
        delete this.$session.userId;

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
                                if (isWebBuild) {
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

        //await this.$settings.set("CurrentJiraUrl", this.state.jiraUrl);
        await this.$settings.set("CurrentUserId", id);
        if (this.props.setAuthType) {
            this.props.setAuthType('1');
        } else {
            this.$jaBrowserExtn.openTab("/index.html");
            window.close();
        }
    };

    onSettingsImport = () => {
        if (isWebBuild) {
            this.props.setAuthType('1');
        } else if (isQuickView) {
            this.$jaBrowserExtn.openTab("/index.html");
            window.close();
        } else {
            redirectToRoute();
        }
    };

    render() {
        const { integrate, state: { jiraUrl, isLoading } } = this;

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