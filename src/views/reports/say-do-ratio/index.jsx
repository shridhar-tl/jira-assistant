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

function SayDoRatioReport() {
    const [isLoading, setLoader] = React.useState(false);
    const [selectedSprint, setSprint] = React.useState();
    const [editMode, toggleEdit] = useToggler(true);
    const [settings, updateSettings] = React.useState(getSettings());
    const [reportData, setReportData] = React.useState([]);
    const $this = React.useRef({});
    $this.current.settings = settings;
    $this.current.toggleEdit = toggleEdit;

    const loadReportData = React.useCallback(async () => {
        try {
            setLoader(true);
            const reportData = await getSprintWiseSayDoRatio($this.current.settings);
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
                isGadget={false} isLoading={isLoading}
                onRefresh={loadReportData} customActions={customActions}
            >
                <ScrollableTable dataset={reportData} exportSheetName="Say Do Ratio" containerStyle={{ height: 'auto', maxHeight: '70%' }}>
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
                            <td>{b.name}</td>
                            <td className="text-center">{b.velocity || '-'} {!!b.velocity && <span>({parseFloat(b.velocityGrowth?.toFixed(2) || 0)}%)</span>}</td>
                            {b.sayDoRatio && <td className={getLogClass(b.sayDoRatio)}>
                                {b.sayDoRatio}%
                                <Indicator value={b.sayDoRatio} maxHours={100} />
                            </td>}
                            {!b.sayDoRatio && <td className="text-center">-</td>}
                            <td className="text-center">{b.averageCycleTime ? `${b.averageCycleTime} days` : '-'}</td>
                            {b.sprintList.map(s => (s?.sayDoRatio ? (<td className={getLogClass(s.sayDoRatio, s === selectedSprint)} onClick={() => setSprint(s)} key={s.id}>
                                <span className="fas fa-info-circle float-end" />
                                {s.sayDoRatio}%
                                <Indicator value={parseInt(s.sayDoRatio)} maxHours={100} />
                            </td>) : <td className="text-center">-</td>))}
                        </tr>}
                    </TBody>
                    {!reportData?.length && <NoDataRow span={7}>No data available.</NoDataRow>}
                </ScrollableTable>
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

function getLogClass(value, isSelected) {
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