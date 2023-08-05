import React from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { inject } from '../../services';
import { Link } from 'src/controls';
import { DateDisplay, UserDisplay } from '../../display-controls';
import './JiraUpdates.scss';

function JiraUpdates() {
    const op = React.useRef();

    const [state, setState] = React.useState({});
    const { list, total, ticketCount } = state;

    const showPanel = React.useCallback((e) => {
        op.current.show(e);
        trackViewList(total);
    }, [op, total]);

    const { $utils } = inject('UtilsService');

    React.useEffect(() => {
        getUpdates().then(setState);
    }, []);


    if (!list || !list.length) {
        return null;
    }

    return (<>
        <li className="nav-item">
            <span className="fa fa-comments drop-icon" onClick={showPanel} />
            {total > 0 && <span className="badge badge-warning">{total}</span>}
        </li>
        <OverlayPanel ref={op} className="drop-op">
            <div className="jira-notifications drop-op-container">
                <div className="title text-center">
                    <strong>You have {total} updates on {ticketCount} issues</strong>
                </div>
                <div className="drop-op-body noti-messages">
                    {list.map((msg, i) => (<Message key={i} message={msg} cut={$utils.cut} />))}
                </div>
            </div>
        </OverlayPanel>
    </>);
}

export default JiraUpdates;

function Message({ message: msg, cut }) {
    return (
        <Link className="drop-item" title="Click to view this ticket in jira" href={msg.href}>
            <div className="text-truncate font-weight-bold" title={msg.summary}>
                {msg.key} - {cut(msg.summary, 100, true)}
            </div>
            {msg.updates.map(({ date, author, field, fromString, toString }, i) => <div key={i} className="small text-muted message-text">
                <UserDisplay tag="span" className="user-display" user={author} />
                <span> updated {field} from {fromString} to {toString} </span>
                <DateDisplay tag="span" className="date-display" date={date} quick={true} />
            </div>)}
        </Link>
    );
}

async function getUpdates() {
    const { $jupdates } = inject('JiraUpdatesService');
    return await $jupdates.getRescentUpdates();
}

function trackViewList(total) {
    const { $analytics } = inject('AnalyticsService');
    $analytics.trackEvent("Jira Updates: List viewed", "Updates", `Updates: Total: ${total}`);
}