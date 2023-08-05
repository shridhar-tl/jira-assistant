import React, { PureComponent } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { inject } from '../../services';
import Dialog from '../../dialogs';
import UpdatesInfo from './UpdatesInfo';
import TextParser from '../../components/TextParser';
import { Icons } from 'src/constants/icons';
import './Notifications.scss';

class Notifications extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "NotificationService", "AnalyticsService", "UserUtilsService", "UtilsService");
        const { updates_info, list, total, unread } = props.notifications;
        this.state = { updates_info, list, total, unread };
    }

    setRef = (op) => this.op = op;

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
            markRead(msg, viewed);
            this.setState((s) => ({ unread: (s.unread || 1) - 1 }));
        }
    };

    viewList = (e) => {
        this.op.show(e);
        trackViewList(this.state);
    };

    render() {
        const { list, total, unread } = this.state;

        if (!list || !list.length) {
            return null;
        }

        return (<>
            <li className="nav-item">
                <span className="notification-icon pointer" onClick={this.viewList}>{Icons.bellNotification}</span>
                {unread > 0 && <span className="badge badge-danger">{unread}</span>}
            </li>
            <OverlayPanel ref={this.setRef} className="notification-op drop-op">
                <div className="message-container drop-op-container">
                    <div className="title text-center">
                        <strong>You have {unread || total} {unread ? "unread" : ""} messages</strong>
                    </div>
                    <div className="drop-op-body messages">
                        {list.map((msg, i) => (<Message key={i}
                            message={msg}
                            onOpen={this.readMessage}
                            onRead={this.markRead}
                            cut={this.$utils.cut}
                        />))}
                    </div>
                </div>
            </OverlayPanel>
        </>);
    }
}

export default Notifications;

function Message({ message, onOpen, onRead, cut }) {
    const readMessage = React.useCallback(() => onOpen(message), [message, onOpen]);
    const markRead = React.useCallback(() => onRead(message), [message, onRead]);

    return (
        <div className="message" title="Click to view this message">
            {!message.read && <small className="float-end mt-0" onClick={markRead} title="Click to mark this message as read">
                <span className="fa fa-eye mark-read" /></small>}
            <div className={`message-title text-truncate${message.read ? "" : " font-weight-bold"}`} onClick={readMessage}>
                {message.important && <span className="fa fa-exclamation text-danger"></span>} {message.title}
            </div>
            <div className="small text-muted message-text" onClick={readMessage}><TextParser message={cut(message.message, 175, true)} /></div>
        </div>
    );
}

function markRead(msg, viewed) {
    if (!msg.read) {
        const { $noti } = inject('NotificationService');
        msg.read = true;
        $noti.markRead(msg);
        const event = (viewed ? "Viewed" : "Mark as read");
        trackAnalytics(msg, event);
    }
}

function trackAnalytics(msg, event) {
    const { $analytics } = inject('AnalyticsService');
    $analytics.trackEvent((msg.type === "versionInfo" ? "Update Info: " : "Message: ") + event, "Messages", `Message Id: ${msg.id}`);
}

function trackViewList({ total, unread }) {
    const { $analytics } = inject('AnalyticsService');
    $analytics.trackEvent("Messages: List viewed", "Messages", `Messages: Total: ${total}, Unread: ${unread}`);
}
