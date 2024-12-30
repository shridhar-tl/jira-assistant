import React from 'react';
import { Column, NoDataRow, ScrollableTable, TBody, THead } from 'src/components/ScrollableTable';
import SayDoRatioChart from './SayDoRatioChart';
import Indicator from '../../../components/worklog-indicator';
import SprintInfo from './SprintInfo';
import SprintStatusWiseTimeSpentChart from './SprintStatusWiseTimeSpentChart';

const changeLogErrorMessage = "Unable to fetch change logs and hence data may not be accurate";

function ReportData({ reportData, settings }) {
    const [selectedSprint, setSprint] = React.useState();

    return (<>
        <ScrollableTable dataset={reportData} containerStyle={{ height: 'auto', maxHeight: '70%' }} exportable={false}>
            <THead>
                <tr>
                    <Column sortBy="name">Board Name</Column>
                    <Column sortBy="velocity" className="text-center">Velocity</Column>
                    <Column sortBy="sayDoRatio" className="text-center">Say-Do-Ratio</Column>
                    <Column sortBy="averageCycleTime" className="text-center">Cycle Time</Column>
                    {loop(settings.noOfSprints, (i) => {
                        const sprintTitle = settings.noOfSprints === (i + 1) ? `Last sprint (n-1)` : `Sprint n${i - settings.noOfSprints}`;
                        return (<Column key={i} className="text-center">{sprintTitle}</Column>);
                    })}
                </tr>
            </THead>
            <TBody className="no-log-bg-hl">
                {(b) => <tr key={b.id}>
                    <td>{b.name} {b.logUnavailable && <span className="fas fa-exclamation-triangle msg-warning" title={changeLogErrorMessage} />}</td>
                    <td className="text-center">{b.velocity || '-'} {!!b.velocity && <span>({parseFloat(b.velocityGrowth?.toFixed(2) || 0)}%)</span>}</td>
                    <td className={getLogClass(b.sayDoRatio)}>
                        {formatValue(b.sayDoRatio)}
                        {!!b.sayDoRatio && <Indicator value={b.sayDoRatio} maxHours={100} />}
                    </td>
                    <td className="text-center">{b.averageCycleTime ? `${b.averageCycleTime} days` : '-'}</td>
                    {b.sprintList.map((s, index) => (s ? (<td className={`sprint-info-cell ${getLogClass(s.sayDoRatio, s === selectedSprint)}`} onClick={() => setSprint(s)} key={s.id}>
                        <span className="fas fa-info-circle float-end" />
                        {!!s.sayDoRatio && <span>{s.sayDoRatio}%</span>}
                        {!s.sayDoRatio && <span>-</span>}
                        {!b.logUnavailable && s.logUnavailable && <span className="fas fa-exclamation-triangle msg-warning" title={changeLogErrorMessage} />}
                        {!!s.sayDoRatio && <Indicator value={parseInt(s.sayDoRatio)} maxHours={100} />}
                    </td>) : <td className="text-center" key={index}>-</td>))}
                </tr>}
            </TBody>
            {!reportData?.length && <NoDataRow span={7}>No data available.</NoDataRow>}
        </ScrollableTable>
        <table className='d-none exportable' export-sheet-name="Say Do Ratio">
            <thead>
                <tr>
                    <th rowSpan={2}>Board Name</th>
                    <th rowSpan={2}>Velocity</th>
                    <th rowSpan={2}>Say-Do-Ratio</th>
                    <th rowSpan={2}>Cycle Time</th>
                    {loop(settings.noOfSprints, (i) => {
                        const sprintTitle = settings.noOfSprints === (i + 1) ? `Last sprint (n-1)` : `Sprint n${i - settings.noOfSprints}`;
                        return (<th key={i} colSpan={3} className="text-center">{sprintTitle}</th>);
                    })}
                </tr>
                <tr>
                    {loop(settings.noOfSprints, (i) => (<React.Fragment key={i}>
                        <th>Say-Do-Ratio</th>
                        <th>Velocity</th>
                        <th>Cycle Time</th>
                    </React.Fragment>))}
                </tr>
            </thead>
            <tbody>
                {reportData.map((b) => <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.velocity} {!!b.velocity && <span>({parseFloat(b.velocityGrowth?.toFixed(2) || 0)}%)</span>}</td>
                    <td>{formatValue(b.sayDoRatio)}</td>
                    <td>{formatValue(b.averageCycleTime, ' days')}</td>
                    {b.sprintList.map((s, i) => (<React.Fragment key={i}>
                        <td>{formatValue(s?.sayDoRatio)}</td>
                        <td>{formatValue(s?.velocity)}</td>
                        <td>{formatValue(s?.cycleTime)}</td>
                    </React.Fragment>))}
                </tr>)}
            </tbody>
        </table>
        {selectedSprint && <div className="row m-0 mt-3">
            <SprintInfo sprint={selectedSprint} onClose={() => setSprint(null)} />
        </div>}
        <div className="row m-0 mt-3">
            {reportData?.map(b => <>
                <SayDoRatioChart key={b.id} board={b} />
                <SprintStatusWiseTimeSpentChart key={b.id} board={b} />
            </>)}
        </div>
    </>);
}

export default ReportData;

function formatValue(value, suffix = "%", defaultValue = '') {
    return value ? `${value}${suffix}` : defaultValue;
}

function getLogClass(value, isSelected) {
    if (!value) {
        return isSelected ? 'text-center selected' : 'text-center';
    }

    let className = 'log-good';

    if (value >= 85) {
        className = 'log-good';
    } else if (value >= 70) {
        className = 'log-less';
    } else {
        className = 'log-high';
    }

    return `log-indi-cntr ${className}${isSelected ? ' selected' : ''}`;
}

function loop(num, callback) {
    const result = [];

    for (let i = 0; i < num; i++) {
        result.push(callback(i));
    }

    return result;
}