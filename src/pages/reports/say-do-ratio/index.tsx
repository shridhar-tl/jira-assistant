import { useCallback, useRef, useState } from 'react';

import { GadgetContainer, useBaseGadget } from '@/gadgets/BaseGadget';

import { Button } from '@components';

import { getSettings, getSprintWiseSayDoRatio } from './helper';
import ReportData from './ReportData';
import ReportInfo from './ReportInfo';
import ReportSettingsDialog from './settings';
import type { BoardData, ReportSettings } from './types';

import './SayDoRatioReport.css';

function SayDoRatioReport() {
    const [progress, setProgress] = useState<number>();
    const [editMode, toggleEdit] = useState(true);
    const [settings, updateSettings] = useState<ReportSettings>(getSettings());
    const [reportData, setReportData] = useState<BoardData[]>([]);
    const $this = useRef<any>({});
    $this.current.settings = settings;
    $this.current.toggleEdit = () => toggleEdit((prev) => !prev);

    const gadgetHook = useBaseGadget({ isGadget: false }, { title: 'Say Do Ratio Report', className: 'say-do-report-gadget' });
    const { setIsLoading } = gadgetHook;

    const loadReportData = useCallback(async () => {
        try {
            setProgress(0);
            setReportData([]);
            setIsLoading(true);
            const reportData = await getSprintWiseSayDoRatio($this.current.settings).progress(({ completed, data }: any) => {
                setProgress(completed);
                if (data) {
                    setReportData(data);
                }
            });
            setReportData(reportData);
        } catch (err) {
            console.error('Failed to load say-do ratio report data:', err);
        } finally {
            setIsLoading(false);
            setProgress(undefined);
        }
    }, [setIsLoading]);
    $this.current.loadReportData = loadReportData;

    const applySettings = useCallback(async (newSettings: ReportSettings) => {
        updateSettings(newSettings);
        $this.current.settings = newSettings;
        await $this.current.loadReportData();
        $this.current.toggleEdit();
    }, []);

    const customActions = (
        <Button
            layout="plain"
            leftIcon={<i className="fa fa-edit" />}
            onClick={() => toggleEdit(true)}
            title="Edit report configuration"
            size="sm"
        />
    );

    return (
        <div className="say-do-report">
            <GadgetContainer
                isGadget={false}
                gadgetHook={gadgetHook}
                customActions={customActions}
                refreshData={loadReportData}
                loadingProgress={progress}
            >
                {!reportData?.length && <ReportInfo />}
                {reportData?.length > 0 && <ReportData reportData={reportData} settings={settings} />}
            </GadgetContainer>
            <ReportSettingsDialog settings={settings} show={editMode} onHide={() => toggleEdit(false)} onDone={applySettings} />
        </div>
    );
}

export default SayDoRatioReport;
