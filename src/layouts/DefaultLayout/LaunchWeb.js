import React, { PureComponent } from 'react';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle, Nav } from 'reactstrap';
import { isWebBuild } from '../../constants/build-info';
import { JAWebLaunchUrl } from '../../constants/urls';
import { withRouter } from '../../pollyfills';
import { inject } from '../../services/injector-service';

const options = isWebBuild ? {
    btnText: 'Web',
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

    switchToWeb = async () => {
        await this.$settings.set('useWebVersion', !isWebBuild || null);
        window.location.href = this.getLaunchPath();
    };

    showOptions() {
        const { switched, launchUrl } = this.state;
        return (!isWebBuild || this.usingExtn) && !!launchUrl && (!isWebBuild || switched);
    }

    render() {
        if (!this.showOptions()) { return null; }

        const launchPath = this.getLaunchPath();

        return (
            <Nav className="d-md-down-none margin-r-5" navbar>
                <UncontrolledDropdown nav direction="down">
                    <DropdownToggle nav>
                        <span className="btn btn-success web-try" title={options.btnTooltip}> <i className="fa fa-external-link" /> <strong>{options.btnText}</strong></span>
                    </DropdownToggle>
                    <DropdownMenu left>
                        <DropdownItem header tag="div" className="text-center"><strong>Jira Assistant Web</strong></DropdownItem>
                        <DropdownItem tag="a" href={launchPath} target="_blank" title={options.launchTooltip}>
                            <i className="fa fa-external-link"></i> {options.launchText}</DropdownItem>
                        <DropdownItem tag="button" title={options.switchTooltip} onClick={this.switchToWeb}>
                            <i className="fa fa-plug"></i> {options.switchText}</DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
            </Nav>
        );
    }
}

export default withRouter(LaunchWeb);