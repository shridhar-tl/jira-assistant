import { useState } from 'react';

import JQLEditor from '@/jira-controls/JQLEditor';

import { Button, RadioButton, Splitter, SplitterPanel } from '@components';

import { updateDataSourceType, updateJQL, usePivotConfig, useSelectedItem } from '../../store/pivot-config';
import SideBar from '../SideBar';

import PivotConfig from './config';
import ItemProperties from './config/ItemProperties';
import ControlButtons from './ControlButtons';
import FieldsCollection from './fields';

interface EditorControlsProps {
    show: boolean;
    onHide: () => void;
    reportId?: string;
}

export default function EditorControls({ show, onHide, reportId }: EditorControlsProps) {
    const [showSource, setShowSource] = useState(!reportId);
    const toggleSource = () => setShowSource(!showSource);
    const headerRight = <ControlButtons reportId={reportId} />;

    return (
        <SideBar
            show={show}
            onHide={onHide}
            title="Report Config"
            onBackClick={showSource ? undefined : toggleSource}
            controls={headerRight}
            width="620"
            contentClassName="p-0"
        >
            <div className="h-full flex flex-col">{showSource ? <Source onDone={toggleSource} /> : <Controls />}</div>
        </SideBar>
    );
}

interface SourceProps {
    onDone: () => void;
}

function Source({ onDone }: SourceProps) {
    const jql = usePivotConfig(({ jql }) => jql);
    const dataSourceType = usePivotConfig(({ dataSourceType }) => dataSourceType);

    return (
        <div className="p-4">
            <p className="mb-4 text-sm text-[--text-secondary]">
                Select a data source option for retrieving a list of issues. You have the choice of utilizing direct Jira Query Language
                (JQL) queries or extracting a list of issues based on a specific sprint and subsequently applying a JQL filter to refine the
                results.
            </p>

            <label className="font-semibold mt-4 block">Data source type:</label>
            <RadioButton
                className="block mt-2"
                checked={dataSourceType === 1}
                value="1"
                label="Use raw JQL to filter and pull issues list"
                onChange={() => updateDataSourceType(1)}
            />
            <RadioButton
                className="block mt-2"
                checked={dataSourceType === 2}
                value="2"
                label="Pull issues for select sprints and apply JQL filter"
                onChange={() => updateDataSourceType(2)}
                disabled
            />

            <label className="font-semibold mt-4 block">JQL Query:</label>
            <JQLEditor jql={jql} plugged onChange={updateJQL} />

            <Button
                className="mt-4 float-right"
                rightIcon={<span className="fa fa-arrow-right" />}
                disabled={dataSourceType !== 2 && (jql?.length || 0) < 5}
                onClick={onDone}
                title="Configure data source"
            >
                Select fields
            </Button>
        </div>
    );
}

function Controls() {
    const selection = useSelectedItem();
    const hasFieldSelected = !!selection?.item;

    const fieldConfig = (
        <div className="flex flex-row h-full min-h-0 border-t border-[--border-primary]">
            <div className="overflow-y-auto border-r border-[--border-primary]" style={{ width: '320px', minWidth: '320px' }}>
                <PivotConfig />
            </div>
            <div className="flex-1 min-w-0 min-h-0">
                <FieldsCollection />
            </div>
        </div>
    );

    if (hasFieldSelected) {
        return (
            <Splitter layout="vertical" className="flex-1 border-t border-[--border-primary]">
                <SplitterPanel minSize="20%">
                    {fieldConfig}
                </SplitterPanel>
                <SplitterPanel minSize="120px" defaultSize="360px">
                    <ItemProperties selection={selection} />
                </SplitterPanel>
            </Splitter>
        );
    }

    return <div className="h-full">{fieldConfig}</div>;
}
