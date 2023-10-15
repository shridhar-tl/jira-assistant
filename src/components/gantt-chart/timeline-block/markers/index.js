import React from 'react';
import moment from 'moment';
import { GanttContext } from '../../store';
import './Markers.scss';

function Markers({ divRef }) {
    const { markers, fromDate } = React.useContext(GanttContext);

    const markersList = React.useMemo(() => {
        if (!markers) {
            return;
        }

        const $fromDate = moment(fromDate);
        return markers.map(ms => ({ name: ms.name, colIndex: -$fromDate.diff(ms.date, 'days') }));
    }, [markers, fromDate]);

    if (!markers?.length) {
        return null;
    }

    return (<div ref={divRef} className="gantt-chart-markers">
        {markersList.map((ms, i) => (<div key={i} className="marker" style={{ left: `${ms.colIndex * 35}px` }}>
            <span>{ms.name}</span>
            <div className="marker-left-arrow" />
        </div>))}
    </div>);
}

export default Markers;
