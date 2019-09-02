import React, { PureComponent } from 'react';
import { inject } from '../../../services';
import { Button, TextBox } from '../../../controls';
import { ApiUrls } from '../../../_constants';

class Integrate extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "AjaxService", "DatabaseService", "MessageService", "CacheService", "AppBrowserService", "SessionService");

        this.browser = navigator.userAgent;
        this.state = {};
    }

    UNSAFE_componentWillMount() {
        this.$jaBrowserExtn.getAppVersion().then(v => this.setState({ version: v }));

        this.$jaBrowserExtn.getCurrentUrl().then((url) => {
            const root = this.getJiraRootUrl(url);
            if (root && root.length > 20 && root.startsWith('http')) {
                this.setState({ jiraUrl: root });
            }
        });
    }

    getJiraRootUrl(url) {
        return url.replace(/^(.*\/\/[^/?#]*).*$/, "$1");
    }

    integrate = () => {
        const root = this.state.jiraUrl.trim().trimEnd('/').trimEnd('\\');
        this.setState({ jiraUrl: root });
        this.$session.rootUrl = root;
        this.setState({ isLoading: true });

        this.$ajax.get(ApiUrls.mySelf).then((data) => {
            const name = data.name;
            const email = data.emailAddress;
            this.$db.users.where("userId").equalsIgnoreCase(name)
                .and((u) => { return u.jiraUrl.toLowerCase() === root.toLowerCase(); }).first()
                .then((user) => {
                    if (!user) {
                        user = {
                            jiraUrl: root,
                            userId: name,
                            email: email,
                            lastLogin: new Date(),
                            dateFormat: "dd-MMM-yyyy",
                            timeFormat: " hh:mm:ss tt",
                            maxHours: 8,
                            dateCreated: new Date()
                        };
                        this.$db.users.add(user)
                            .then((id) => {
                                return id;
                            }, this.handleDBError)
                            .then(this.openDashboard);
                    }
                    else {
                        user.jiraUrl = root;
                        user.userId = name;
                        user.email = email;
                        user.lastLogin = new Date();
                        this.$db.users.put(user)
                            .then((id) => {
                                return user.id;
                            }, this.handleDBError)
                            .then(this.openDashboard);
                    }
                });
        }, (response) => {
            response = response || {};
            if (response.status === 401) {
                this.$message.warning("You are not authenticated with Jira to integrate.", "Unauthorized");
            }
            else {
                this.$message.error("This is not a valid Jira server url or the server does not respond.", "Unknown server");
            }
        }).then(() => { this.setState({ isLoading: false }); });
    }

    handleDBError = (err) => {
        this.$message.error("Unable to save the changes. Verify if you have sufficient free space in your C:", "Allocation failed");
        return -1;
    }

    openDashboard = (id) => {
        if (id <= 0) {
            return;
        }
        this.$cache.set("CurrentJiraUrl", this.state.jiraUrl);
        this.$cache.set("CurrentUserId", id);
        this.$jaBrowserExtn.openTab("/index.html");
        window.close();
    }

    render() {
        const { integrate, version, browser, state: { jiraUrl, isLoading } } = this;

        return (
            <div className="app flex-row align-items-center">
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
                                            placeholder="Jira url (eg: http://jira.example.com)" />
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
                                            <span>© 2019 Jira Assistant</span>
                                        </div>
                                        <div className="col-6" style={{ textAlign: 'right' }}>
                                            <span>
                                                <i className="fa fa-youtube" />
                                                <a href="https://www.youtube.com/embed/f2aBSXzbYuA?rel=0&autoplay=1&showinfo=0&cc_load_policy=1&start=34" target="_blank" rel="noopener noreferrer"
                                                    title="Click to open youtube video guiding you to setup Jira Assistant">Help setup</a>
                                            </span> |
                                            <span>
                                                <i className="fa fa-phone" />
                                                <a href={`https://docs.google.com/forms/d/e/1FAIpQLScJvQtHZI_yZr1xd4Z8TwWgvtFss33hW5nJp4gePCgI2ScNvg/viewform?entry.1426640786=${version}&entry.972533768=${browser}`}
                                                    target="_blank" rel="noopener noreferrer" title="Click to report about any issues or ask a question">Contact us</a>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Integrate.propTypes = {

};

export default Integrate;