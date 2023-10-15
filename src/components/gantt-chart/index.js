import React from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { PropsProvider, initStoreWithProps } from './store';
import GanttFieldsContainer from './fields-block';
import GanttDateRangeContainer from './timeline-block';
import './GanttChart.scss';

function GanttChart(props) {
    const {
        columns, items,
        fromDate, toDate,
        height
    } = props;
    const propsRef = React.useRef(props);
    propsRef.current = props;

    React.useMemo(() => {
        initStoreWithProps(fromDate, toDate, propsRef.current.isDayHoliday);
    }, [fromDate, toDate]);

    const leftBlock = React.useRef(null);
    const rightBlock = React.useRef(null);

    return (<div className="gantt-chart">
        <PropsProvider value={props}>
            <Splitter style={{ height }}>
                <SplitterPanel size={10}>
                    <GanttFieldsContainer columns={columns} items={items} leftBlock={leftBlock} rightBlock={rightBlock} />
                </SplitterPanel>
                <SplitterPanel>
                    <GanttDateRangeContainer items={items} leftBlock={leftBlock} rightBlock={rightBlock} />
                </SplitterPanel>
            </Splitter>
        </PropsProvider>
    </div>);
}

export default GanttChart;

