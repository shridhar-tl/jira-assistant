import React from 'react';
import Link from '../../../../controls/Link';
import { useSprintIssueStatus } from './actions';

const alignBottomStyle = { verticalAlign: 'bottom' };

function Card({ item, scope: { getTicketUrl, epicNameField, estimation } }) {
    const {
        key,
        fields: {
            summary,
            assignee = {},
            [estimation.fieldId]: storypoint,
            [epicNameField?.id]: epic = {},
            status = {},
            priority: { iconUrl: priorityUrl, name: priority } = {},
            issuetype: { iconUrl: typeUrl, name: issuetype }
        }
    } = item;

    const { isUpdating, isEpicSelected } = useSprintIssueStatus(({ [item.key]: updating, selectedEpic }) => ({
        isUpdating: updating,
        isEpicSelected: epic && selectedEpic === epic
    }));

    let style = status.statusCategory?.colorName;
    if (style?.includes('-')) {
        style = style.split('-')[0];
    }
    style = style ? { borderLeftColor: style } : undefined;

    if (isUpdating) {
        style = style || {};
        style.opacity = .5;
    }

    if (isEpicSelected) {
        style.backgroundColor = '#ffd6ff';
    }

    return (<div className="card-container" style={style}>
        <div className="card-title">{summary}</div>
        <div className="controls">
            <div className="w-100">
                <div className="float-end">
                    {epic && <Link className="link pointer font-bold me-2"
                        href={getTicketUrl(epic)} style={alignBottomStyle}>{epic}</Link>}
                    {(storypoint || storypoint === 0) && <div
                        className="rounded-circle inline-block img-x24 px-2 bg-grey me-1"
                        style={alignBottomStyle}>{storypoint}</div>}
                    {priorityUrl && <img src={priorityUrl} className="img-x16 me-1" alt={priority} title={priority} />}
                    {assignee && <img className="img-x24 me-1 rounded-circle"
                        src={assignee.avatarUrls?.['16x16'] || assignee.avatarUrls?.['24x24']}
                        alt={assignee.displayName} title={assignee.displayName} />}
                </div>
                <div className="float-start">
                    <img src={typeUrl} className="img-x16 me-1" alt={issuetype} title={issuetype} />
                    <Link className="link pointer" href={getTicketUrl(key)}>{key}</Link>
                    {isUpdating && <span className="fa fa-spinner fa-spin ms-2" />}
                </div>
            </div>
        </div>
    </div>);
}

export default Card;
