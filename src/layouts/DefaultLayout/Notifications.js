import React, { PureComponent } from 'react';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { inject } from '../../services';
import Dialog from '../../dialogs';
import UpdatesInfo from './UpdatesInfo';
import TextParser from '../../components/TextParser';

class Notifications extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "NotificationService", "AnalyticsService", "UserUtilsService", "UtilsService");
        const { updates_info, list, total, unread } = props.notifications;
        this.state = { updates_info, list, total, unread };
    }

    readMessage = (msg) => {
        let message = msg.message;
        let styles = null;
        if (msg.type === "versionInfo") {
            styles = { width: '90vw', maxWidth: '1000px' };
            message = <UpdatesInfo updates={this.state.updates_info} />;
        } else {
            message = <TextParser message={message} />;
        }

        const onClosed = () => this.markRead(msg, true);
        Dialog.alert(message, msg.title, styles).then(onClosed, onClosed);
    };

    markRead = (msg, viewed) => {
        if (!msg.read) {
            msg.read = true;
            this.$noti.markRead(msg);
            const event = (viewed ? "Viewed" : "Mark as read");
            this.trackAnalytics(msg, event);
            this.setState((s) => ({ unread: (s.unread || 1) - 1 }));
        }
    };

    trackViewList = () => {
        const { total, unread } = this.state;
        this.$analytics.trackEvent("Messages: List viewed", "Messages", `Messages: Total: ${total}, Unread: ${unread}`);
    };

    trackAnalytics(msg, event) {
        this.$analytics.trackEvent((msg.type === "versionInfo" ? "Update Info: " : "Message: ") + event, "Messages", `Message Id: ${msg.id}`);
    }

    render() {
        const { list, total, unread } = this.state;

        if (!list || !list.length) {
            return null;
        }

        return (
            <UncontrolledDropdown nav direction="down">
                <DropdownToggle nav onClick={this.trackViewList} className="notification-icon">
                    <i className="bx bx-bell"></i>{unread > 0 && <span className="float-end badge badge-danger">{unread}</span>}
                </DropdownToggle>
                <DropdownMenu end className="messages notification-menu">
                    <DropdownItem header tag="div" className="notification-title">
                        <span className="float-end badge badge-default">{unread}</span>
                        <div className="text-center"><strong>You have {unread || total} {unread ? "unread" : ""} messages</strong></div>
                    </DropdownItem>
                    {list.map((msg, i) => (<Message key={i} message={msg} onOpen={this.readMessage} onRead={this.markRead} cut={this.$utils.cut} />))}
                    {/*<div className="text-end">
                        <span className="view-more">View All</span>
                    </div>*/}
                </DropdownMenu>
            </UncontrolledDropdown>
        );
    }
}

export default Notifications;

class Message extends PureComponent {
    readMessage = () => this.props.onOpen(this.props.message);
    markRead = () => this.props.onRead(this.props.message);

    render() {
        const { message: msg, cut } = this.props;

        return (
            <DropdownItem tag="div" title="Click to view this message">
                {!msg.read && <small className="float-end mt-0" onClick={this.markRead} title="Click to mark this message as read">
                    <span className="fa fa-eye mark-read" /></small>}
                <div className={`text-truncate${msg.read ? "" : " message-unread"}`} onClick={this.readMessage}>
                    {msg.important && <span className="fa fa-exclamation text-danger"></span>} {msg.title}
                </div>
                <div className="small text-muted message" onClick={this.readMessage}><TextParser message={cut(msg.message, 175, true)} /></div>
                <hr />
            </DropdownItem>
        );
    }
}

