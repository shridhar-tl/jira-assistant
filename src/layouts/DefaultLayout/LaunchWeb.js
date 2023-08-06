import React, { PureComponent } from 'react';
import { isExtnBuild, isWebBuild } from '../../constants/build-info';
import { JAWebLaunchUrl } from '../../constants/urls';
import { withRouter } from '../../pollyfills';
import { inject } from '../../services/injector-service';
import { showContextMenu } from 'src/externals/jsd-report';

const options = isWebBuild ? {
    btnText: 'Extn',
    btnTooltip: 'Go back to extension',
    launchText: 'Launch Extension',
    switchText: 'Switch back',
    launchTooltip: 'Launch Jira Assistant extension once',
    switchTooltip: 'Switch back to Jira Assistant extension'
} : {
    btnText: 'Web',
    btnTooltip: 'Checkout Jira Assistant Web',
    launchText: 'Launch JA Web',
    switchText: 'Switch to JA Web',
    launchTooltip: 'Launch latest Jira Assistant Web version once',
    switchTooltip: 'Switch to Web version. You can come back later any time.'
};

class LaunchWeb extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { switched: false };
        inject(this, 'SettingsService', 'AppBrowserService');
    }

    async componentDidMount() {
        this.usingExtn = isWebBuild && localStorage.getItem('authType') === '1';
        if (isWebBuild) {
            const launchUrl = await this.$jaBrowserExtn.getLaunchUrl('index.html');
            this.setState({ launchUrl });
        } else {
            this.setState({ launchUrl: JAWebLaunchUrl });
        }
        const switched = await this.$settings.get('useWebVersion');
        this.setState({ switched });
    }

    getLaunchPath() {
        const curPath = this.props.location.pathname;
        return `${this.state.launchUrl}#${curPath}`;
    }

    switchToWeb = async (always) => {
        if (always !== false) {
            await this.$settings.set('useWebVersion', !isWebBuild || null);
        }
        window.location.href = this.getLaunchPath();
    };

    showOptions() {
        const { switched, launchUrl } = this.state;
        return !!launchUrl && (isExtnBuild || (this.usingExtn && switched));
    }

    showMenus = (e) => {
        const menus = [
            {
                label: 'Use Jira Assistant Web', items: [
                    {
                        label: options.launchText, icon: "fa fa-external-link", command: () => this.switchToWeb(false)
                    },
                    { label: options.switchText, icon: "fa fa-plug", command: this.switchToWeb }
                ]
            }
        ];
        showContextMenu(e, menus);
    };

    render() {
        if (!this.showOptions()) { return null; }

        return (<li className="nav-item">
            <span className="p-button p-button-success p-button-xs web-try" title={options.btnTooltip} onClick={this.showMenus}> <i className="fa fa-external-link" /> <strong>{options.btnText}</strong></span>
        </li>);
    }
}

export default withRouter(LaunchWeb);