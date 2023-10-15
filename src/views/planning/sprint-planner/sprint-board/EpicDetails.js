import React from 'react';
import classNames from 'classnames';
import Color from 'color-converter';
import { contrastColor } from 'contrast-color';
import { Link } from 'src/controls';
import { connect } from '../store';
import { useSprintIssueStatus } from './actions';
import './EpicDetails.scss';

function EpicDetails({ columns, epicList, issueColorField, scope, collapsedStates, columnKeyField }) {
    if (!epicList) {
        return;
    }

    const generateEpicCells = () => {
        const rows = [];

        epicList.forEach(epic => {
            const props = spreadProps({ epic, scope, issueColorField, collapsed: collapsedStates[epic.startSprintId] });

            let currentRow = rows[rows.length - 1];

            if (!currentRow || currentRow[props.startSprintIndex]) {
                currentRow = new Array(columns.length).fill(null);
                rows.push(currentRow);
                props.emptyRowColSpan = props.startSprintIndex;
            } else {
                let index = (props.startSprintIndex - 1);
                let count = 0;
                while (index > 0) {
                    if (currentRow[index]) {
                        break;
                    }

                    count++;
                    index--;
                }
                props.emptyRowColSpan = count;
            }

            if (props.startSprintIndex < props.endSprintIndex) {
                currentRow.fill(true, props.startSprintIndex + 1, props.endSprintIndex + 1);
            }


            const epicItem = (<EpicRow {...props} />);
            currentRow[props.startSprintIndex] = epicItem;
        });

        return rows.map((row, i) => (<tr key={i}>{row}</tr>));
    };

    return (<>
        <thead className="epic-head">
            <tr>{columns.map((column, i) => {
                const keyValue = columnKeyField ? column[columnKeyField] : i;
                const collapsed = collapsedStates[keyValue];

                return (<th key={i} className={collapsed ? 'collapsed-epic-cell' : undefined}></th>);
            })}</tr>
        </thead>
        <tbody className="epic-body">
            {generateEpicCells()}
        </tbody>
    </>);
}


function mapServices({
    $userutils: { formatDate, getTicketUrl }
}) {
    return { scope: { formatDate, getTicketUrl } };
}

export default connect(EpicDetails, mapEpicStateToProps, null,
    ['UserUtilsService', mapServices]);

function EpicRow(props) {
    const {
        issueKey, isDone, startSprintIndex, emptyRowColSpan, cutEnd, endSprintIndex, dueSprintIndex,
        epicSpan, epicText, showEpicDetails, collapsed, style, typeUrl, issuetype, scope, summary
    } = props;

    const toggleSelection = React.useCallback(() => selectEpic(issueKey), [issueKey]);
    const isSelected = useSprintIssueStatus(({ selectedEpic }) => selectedEpic === issueKey);

    const emptyStart = startSprintIndex > 0 && emptyRowColSpan ? <td colSpan={emptyRowColSpan}></td> : null;

    const delayDetails = dueSprintIndex >= 0 && cutEnd < endSprintIndex ? <td colSpan={endSprintIndex - cutEnd}>
        <div className="epic-delay-info p-1 font-bold">
            <span className="fa fa-exclamation-triangle float-end text-danger epic-past-due"
                title="Due date past" />
        </div>
    </td> : null;

    const epicDetails = (<td colSpan={epicSpan} title={epicText} onClick={toggleSelection}>
        <div className={classNames(
            'epic-info font-bold',
            {
                'delayed': !!delayDetails,
                'p-1': showEpicDetails,
                'py-1': !showEpicDetails,
                'collapsed': collapsed,
                selected: isSelected
            }
        )} style={style}>
            <img className={`img-x24 ${showEpicDetails ? 'me-2' : 'ms-1'}`} src={typeUrl}
                alt={issuetype} title={epicText} style={{ verticalAlign: 'top' }} />
            {showEpicDetails && <>
                <Link className={isDone ? 'strike-out' : undefined}
                    href={scope.getTicketUrl(issueKey)}
                    style={style}>{issueKey}</Link> - {summary}
            </>}
            {dueSprintIndex < 0 && <span className="fa fa-exclamation-triangle float-end text-danger epic-past-due"
                title="Due date past" />}
        </div>
    </td>);


    return (<React.Fragment key={issueKey}>
        {emptyStart}
        {epicDetails}
        {delayDetails}
    </React.Fragment>);
}

function spreadProps({ epic, scope, issueColorField, collapsed }) {
    const {
        key,
        fields: {
            summary,
            [issueColorField?.id]: epicColor,
            status = {},
            issuetype: {
                iconUrl: typeUrl,
                name: issuetype
            }
        },
        startSprintIndex, endSprintIndex, dueSprintIndex
    } = epic;

    const isDone = status?.statusCategory?.key === 'done' || status?.name?.toLowerCase() === 'done';

    const cutEnd = ((!dueSprintIndex && dueSprintIndex !== 0) || endSprintIndex <= dueSprintIndex) ? endSprintIndex : dueSprintIndex;

    const style = getContrastColorStyles(epicColor);

    const epicSpan = (dueSprintIndex < 0 ? endSprintIndex : (cutEnd - startSprintIndex)) + 1;
    const showEpicDetails = !collapsed || epicSpan > 1;
    const epicText = `${key} - ${summary}`;

    return {
        key, issueKey: key, isDone, startSprintIndex, dueSprintIndex, cutEnd, endSprintIndex, epicSpan,
        epicText, showEpicDetails, collapsed, style, typeUrl,
        issuetype, scope, summary
    };
}

function mapEpicStateToProps({ epicList, issueColorField }) {
    return { epicList, issueColorField };
}

const colorCache = {};
function getContrastColorStyles(color) {
    if (!color || typeof color !== 'string') {
        return;
    }

    if (colorCache[color]) { // This cache is necessary because Color.fromCSS sometimes fails for repeated color
        return colorCache[color];
    }

    try {
        let bgColor = Color.fromCSS(color);

        const threshold = 0.2;

        if (bgColor.lightness > threshold) {
            bgColor = bgColor.lighten(parseInt((bgColor.lightness - threshold) * 100));
        }

        bgColor = bgColor.css();

        const fontColor = contrastColor({ bgColor });

        colorCache[color] = { backgroundColor: bgColor, color: fontColor, borderLeftColor: color };

        return colorCache[color];
    } catch (err) {
        console.error('Trying to get color contrast failed for:', color, err);
    }
}

function selectEpic(key) {
    useSprintIssueStatus.setState(({ selectedEpic }) => ({ selectedEpic: selectedEpic === key ? undefined : key }));
}
