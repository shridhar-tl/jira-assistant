import React from 'react';
import { getSprintWiseSayDoRatio, getSettings } from './helper';
import GadgetLayout from '../../../gadgets/Gadget';
import ReportSettings from './settings';
import useToggler from 'react-controls/hooks/useToggler';
import { Button } from '../../../controls';
import HelpText from './ReportInfo';
import ReportData from './ReportData';
import './SayDoRatioReport.scss';

function SayDoRatioReport() {
    const [isLoading, setLoader] = React.useState(false);
    const [progress, setProgress] = React.useState();
    const [editMode, toggleEdit] = useToggler(true);
    const [settings, updateSettings] = React.useState(getSettings());
    const [reportData, setReportData] = React.useState([]);
    const $this = React.useRef({});
    $this.current.settings = settings;
    $this.current.toggleEdit = toggleEdit;

    const loadReportData = React.useCallback(async () => {
        try {
            setProgress(0);
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
                {!reportData?.length && <HelpText />}
                {reportData?.length > 0 && <ReportData reportData={reportData} settings={settings} />}
            </GadgetLayout>
        </div>
    </>);
}

export default SayDoRatioReport;
