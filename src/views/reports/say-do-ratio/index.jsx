import React from 'react';
import { getSprintWiseSayDoRatio, getSettings } from './helper';
import GadgetLayout from '../../../gadgets/Gadget';
import ReportSettings from './settings';
import useToggler from 'react-controls/hooks/useToggler';
import { Column, NoDataRow, ScrollableTable, TBody, THead } from 'src/components/ScrollableTable';
import SayDoRatioChart from './SayDoRatioChart';
import Indicator from '../../../components/worklog-indicator';
import { Button } from '../../../controls';
import SprintInfo from './SprintInfo';
import './SayDoRatioReport.scss';

const changeLogErrorMessage = "Unable to fetch change logs and hence data may not be accurate";

function SayDoRatioReport() {
    const [isLoading, setLoader] = React.useState(false);
    const [progress, setProgress] = React.useState();
    const [selectedSprint, setSprint] = React.useState();
    const [editMode, toggleEdit] = useToggler(true);
    const [settings, updateSettings] = React.useState(getSettings());
    const [reportData, setReportData] = React.useState([]);
    const $this = React.useRef({});
    $this.current.settings = settings;
    $this.current.toggleEdit = toggleEdit;

    const loadReportData = React.useCallback(async () => {
        try {
            setProgress(0);
            setSprint(null);
            setReportData([]);
            setLoader(true);
            const reportData = await getSprintWiseSayDoRatio($this.current.settings).progress(({ completed, data }) => {
                setProgress(completed);
                if (data) {
                    setReportData(data);
                }
            });
            setReportData(reportData);
        } finally {
            setLoader(false);
        }
    }, []);
    $this.current.loadReportData = loadReportData;

    const applySettings = React.useCallback((newSettings) => {
        updateSettings(newSettings);
        $this.current.settings = newSettings;
        return $this.current.loadReportData().then($this.current.toggleEdit);
    }, []);

    const customActions = (
        <Button type="secondary" icon="fa fa-edit" className="mx-1"
            onClick={toggleEdit} title="Edit report configuration" />
    );

    return (<>
        <ReportSettings settings={settings} show={editMode} onHide={toggleEdit} onDone={applySettings} />
        <div className="page-container">
            <GadgetLayout title="Say Do Ratio Report"
                isGadget={false} isLoading={isLoading} loadingProgress={progress}
                onRefresh={loadReportData} customActions={customActions}
            >
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
                    {reportData?.map(b => <SayDoRatioChart key={b.id} board={b} />)}
                </div>
            </GadgetLayout>
        </div>
    </>);
}

export default SayDoRatioReport;

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