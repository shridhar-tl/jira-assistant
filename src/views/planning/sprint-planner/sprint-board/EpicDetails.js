import React from 'react';
import classNames from 'classnames';
import Color from 'color-converter';
import { contrastColor } from 'contrast-color';
import { Link } from 'src/controls';
import { connect } from '../store';
import { useSprintIssueStatus } from './actions';
import './EpicDetails.scss';

function EpicDetails({ epicList, issueColorField, scope, collapsedStates }) {
    if (!epicList) {
        return;
    }

    return (<tbody className="epic-body">
        {epicList.map(epic => <EpicRow key={epic.key}
            epic={epic} scope={scope}
            issueColorField={issueColorField} collapsed={collapsedStates[epic.startSprintId]} />)}
    </tbody>);
}

function mapServices({
    $userutils: { formatDate, getTicketUrl }
}) {
    return { scope: { formatDate, getTicketUrl } };
}

export default connect(EpicDetails, mapEpicStateToProps, null,
    ['UserUtilsService', mapServices]);

function EpicRow({ epic, scope, issueColorField, collapsed }) {
    const { startSprintIndex, endSprintIndex, dueSprintIndex, key,
        fields: { summary,
            [issueColorField?.id]: epicColor,
            issuetype: { iconUrl: typeUrl, name: issuetype }
        }
    } = epic;

    const toggleSelection = React.useCallback(() => selectEpic(key), [key]);
    const isSelected = useSprintIssueStatus(({ selectedEpic }) => selectedEpic === key);

    const emptyStart = startSprintIndex > 0 ? <td colSpan={startSprintIndex}></td> : null;
    const cutEnd = (!dueSprintIndex || endSprintIndex <= dueSprintIndex) ? endSprintIndex : dueSprintIndex;

    const style = getContrastColorStyles(epicColor);

    const delayDetails = cutEnd < endSprintIndex ? <td colSpan={(endSprintIndex - cutEnd) + 1}>
        <div className="epic-delay-info p-2 font-bold">
            <span className="fa fa-exclamation-triangle float-end text-danger" title="Due date past" />
        </div>
    </td> : null;

    const epicSpan = (cutEnd - startSprintIndex) + 1;
    const showEpicDetails = !collapsed || epicSpan > 1;

    const epicText = `${key} - ${summary}`;

    const epicDetails = (<td colSpan={epicSpan} title={epicText} onClick={toggleSelection}>
        <div className={classNames(
            'epic-info font-bold',
            {
                'delayed': !!delayDetails,
                'p-2': showEpicDetails,
                'py-2': !showEpicDetails,
                'collapsed': collapsed,
                selected: isSelected
            }
        )} style={style}>
            <img className={`img-x24 ${showEpicDetails ? 'me-2' : 'ms-1'}`} src={typeUrl}
                alt={issuetype} title={epicText} style={{ verticalAlign: 'top' }} />
            {showEpicDetails && <>
                <Link href={scope.getTicketUrl(key)} style={style}>{key}</Link> - {summary}
            </>}
        </div>
    </td>);


    return (<tr>
        {emptyStart}
        {epicDetails}
        {delayDetails}
    </tr>);
}

function mapEpicStateToProps({ epicList, issueColorField }) {
    return { epicList, issueColorField };
}

function getContrastColorStyles(color) {
    if (!color) {
        return;
    }

    let bgColor = Color.fromCSS(color);

    const threshold = 0.2;

    if (bgColor.lightness > threshold) {
        bgColor = bgColor.lighten(parseInt((bgColor.lightness - threshold) * 100));
    }

    bgColor = bgColor.css();

    const fontColor = contrastColor({ bgColor });

    return { backgroundColor: bgColor, color: fontColor, borderLeftColor: color };
}

function selectEpic(key) {
    useSprintIssueStatus.setState(({ selectedEpic }) => ({ selectedEpic: selectedEpic === key ? undefined : key }));
}
