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

                return (<th className={collapsed ? 'collapsed-epic-cell' : undefined}></th>);
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
    const { issueKey, startSprintIndex, emptyRowColSpan, cutEnd, endSprintIndex, epicSpan, epicText, showEpicDetails, collapsed, style, typeUrl, issuetype, scope, summary } = props;

    const toggleSelection = React.useCallback(() => selectEpic(issueKey), [issueKey]);
    const isSelected = useSprintIssueStatus(({ selectedEpic }) => selectedEpic === issueKey);

    const emptyStart = startSprintIndex > 0 && emptyRowColSpan ? <td colSpan={emptyRowColSpan}></td> : null;

    const delayDetails = cutEnd < endSprintIndex ? <td colSpan={endSprintIndex - cutEnd}>
        <div className="epic-delay-info p-1 font-bold">
            <span className="fa fa-exclamation-triangle float-end text-danger" title="Due date past" />
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
                <Link href={scope.getTicketUrl(issueKey)} style={style}>{issueKey}</Link> - {summary}
            </>}
        </div>
    </td>);


    return (<React.Fragment key={issueKey}>
        {emptyStart}
        {epicDetails}
        {delayDetails}
    </React.Fragment>);
}

function spreadProps({ epic, scope, issueColorField, collapsed }) {
    const { startSprintIndex, endSprintIndex, dueSprintIndex, key,
        fields: { summary,
            [issueColorField?.id]: epicColor,
            issuetype: { iconUrl: typeUrl, name: issuetype }
        }
    } = epic;

    const cutEnd = (!dueSprintIndex || endSprintIndex <= dueSprintIndex) ? endSprintIndex : dueSprintIndex;

    const style = getContrastColorStyles(epicColor);

    const epicSpan = (cutEnd - startSprintIndex) + 1;
    const showEpicDetails = !collapsed || epicSpan > 1;
    const epicText = `${key} - ${summary}`;

    return {
        issueKey: key, startSprintIndex, cutEnd, endSprintIndex, epicSpan,
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
