import React, { PureComponent } from 'react';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { inject } from '../../services';
import './JiraUpdates.scss';
import { DateDisplay, UserDisplay } from '../../display-controls';

class JiraUpdates extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraUpdatesService", "AnalyticsService", "UtilsService");
        this.state = {};
    }

    UNSAFE_componentWillMount() {
        this.$jupdates.getRescentUpdates().then(res => {
            this.setState(res);
        });
    }

    trackViewList = () => {
        const { total } = this.state;
        this.$analytics.trackEvent("Jira Updates: List viewed", "Updates", `Updates: Total: ${total}`);
    };

    trackAnalytics(msg, event) {
        this.$analytics.trackEvent((msg.type === "versionInfo" ? "Update Info: " : "Message: ") + event, "Messages", `Message Id: ${msg.id}`);
    }

    render() {
        const { list, total, ticketCount } = this.state;

        if (!list || !list.length) {
            return null;
        }

        return (
            <UncontrolledDropdown nav direction="down">
                <DropdownToggle nav onClick={this.trackViewList}>
                    <i className="fa fa-comments"></i>{total > 0 && <span className="badge badge-warning">{total}</span>}
                </DropdownToggle>
                <DropdownMenu right className="jira-notifications">
                    <DropdownItem header tag="div">
                        <div className="text-center"><strong>You have {total} updates on {ticketCount} issues</strong></div>
                    </DropdownItem>
                    <div className="noti-messages">
                        {list.map((msg, i) => (<Message key={i} message={msg}
                            cut={this.$utils.cut} />))}
                    </div>
                </DropdownMenu>
            </UncontrolledDropdown>
        );
    }
}

export default JiraUpdates;

class Message extends PureComponent {
    render() {
        const { message: msg, cut } = this.props;

        return (
            <DropdownItem tag="a" title="Click to view this ticket in jira" href={msg.href} target="_blank">
                <div className={"text-truncate font-weight-bold"} title={msg.summary}>
                    {msg.key} - {cut(msg.summary, 100, true)}
                </div>
                {msg.updates.map(({ date, author, field, fromString, toString }, i) => <div key={i} className="small text-muted message">
                    <UserDisplay tag="span" className="user-display" user={author} />
                    <span> updated {field} from {fromString} to {toString} </span>
                    <DateDisplay tag="span" className="date-display" date={date} quick={true} />
                </div>)}
            </DropdownItem>
        );
    }
}
