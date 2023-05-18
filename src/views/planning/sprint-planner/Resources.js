import React from 'react';
import { Column, ScrollableTable, TBody, THead, TRow } from '../../../components/ScrollableTable';
import { connect } from './store';
import { UserDisplay } from '../../../display-controls';

function Resources({ resources, daysList: { groups, days } }) {
    if (!groups?.length) {
        return null;
    }

    return (<div className="ja-resource-container">
        <ScrollableTable>
            <THead>
                <TRow>
                    <Column rowSpan={2} className="pad-5">Resource Name</Column>
                    {groups.map(g => <Column key={g.sprintId} className="sprint-head" colSpan={g.daysCount}>{g.name}</Column>)}
                </TRow>
                <TRow>
                    {days.map(d => <Column key={d.key} className="day-head">{d.date}<br />{d.week}</Column>)}
                </TRow>
            </THead>
            <TBody>
                {resources.map(r => (<tr>
                    <UserDisplay value={r} />
                    {days.map(d => <td key={d.key}>6</td>)}
                </tr>))}
                <tr>
                    <td>
                        <span className="fa fa-plus" />
                    </td>
                </tr>
            </TBody>
        </ScrollableTable>
    </div>);
}


export default connect(Resources, ({ resources, daysList }) => ({ resources, daysList }));
