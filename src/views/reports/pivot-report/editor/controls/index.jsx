import React from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { RadioButton } from 'react-controls/controls';
import { Button } from '../../../../../controls';
import SideBar from '../SideBar';
import FieldsCollection from './fields';
import PivotConfig from './config';
import ItemProperties from './config/ItemProperties';
import JQLEditor from 'src/jira-controls/JQLEditor';
import { updateJQL, updateDataSourceType, usePivotConfig, useSelectedItem } from '../../store/pivot-config';
import ControlButtons from './ControlButtons';
import useToggler from 'react-controls/hooks/useToggler';
import './Controls.scss';

function EditorControls({ show, onHide, reportId }) {
    const [showSource, toggleSource] = useToggler(!reportId);
    const headerRight = (<ControlButtons reportId={reportId} onToggleDataSource={toggleSource} />);

    return (
        <SideBar show={show} onHide={onHide} title="Report Config"
            onBackClick={showSource ? undefined : toggleSource}
            controls={headerRight} width="500" contentClassName="p-0">
            <div className="editor-controls">
                {showSource ? <Source onDone={toggleSource} /> : <Controls />}
            </div>
        </SideBar>
    );
}

export default EditorControls;

function Source({ onDone }) {
    const { jql, dataSourceType } = usePivotConfig(({ jql, dataSourceType }) => ({ jql, dataSourceType }));

    return (<div className="p-3">
        <p>
            Select a data source option for retrieving a list of issues.
            You have the choice of utilizing direct Jira Query Language (JQL) queries or
            extracting a list of issues based on a specific sprint and subsequently
            applying a JQL filter to refine the results.
        </p>

        <label className="font-bold mt-3">Data source type:</label>
        <RadioButton className="block"
            value={dataSourceType} defaultValue={1}
            label="Use raw JQL to filter and pull issues list"
            onChange={updateDataSourceType} />
        <RadioButton className="block"
            value={dataSourceType} defaultValue={2}
            label="Pull issues for select sprints and apply JQL filter"
            onChange={updateDataSourceType} disabled />

        <label className="font-bold mt-3">JQL Query:</label>
        <JQLEditor jql={jql} plugged onChange={updateJQL} />

        <Button className="float-end me-2" icon="fa fa-arrow-right"
            iconPos="right" label="Select fields" disabled={dataSourceType !== 2 && jql?.length < 5}
            onClick={onDone} title="Configure data source" />
    </div>);
}

function Controls() {
    const selection = useSelectedItem();
    const hasFieldSelected = !!selection?.item;

    let editor = (
        <div className="field-config">
            <PivotConfig />
            <FieldsCollection />
        </div>
    );

    if (hasFieldSelected) {
        editor = (<Splitter style={{ height: '100%' }} layout="vertical">
            <SplitterPanel style={{ height: '10%' }}>
                {editor}
            </SplitterPanel>
            <SplitterPanel style={{ height: '5%' }}>
                <ItemProperties selection={selection} />
            </SplitterPanel>
        </Splitter>);
    }

    return (<div className="controls">
        {editor}
    </div>);
}