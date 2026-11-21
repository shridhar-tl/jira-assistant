import { useState } from 'react';

import { Splitter, SplitterPanel } from '@components';

import { useSelectedItem } from '../../store/pivot-config';
import SideBar from '../SideBar';

import PivotConfig from './config';
import ItemProperties from './config/ItemProperties';
import ControlButtons from './ControlButtons';
import DataSource from './DataSource';
import FieldsCollection from './fields';

interface EditorControlsProps {
    show: boolean;
    onHide: () => void;
    reportId?: string;
    showSourceFirst: boolean;
}

export default function EditorControls({ show, onHide, reportId, showSourceFirst }: EditorControlsProps) {
    const [showSource, setShowSource] = useState(showSourceFirst);
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
            <div className="flex h-full min-h-0 flex-col">{showSource ? <DataSource onDone={toggleSource} /> : <Controls />}</div>
        </SideBar>
    );
}

function Controls() {
    const selection = useSelectedItem();
    const hasFieldSelected = !!selection?.item;

    const fieldConfig = (
        <div className="flex h-full min-h-0 flex-col border-t border-(--border-primary) sm:flex-row">
            <div className="min-h-0 overflow-y-auto border-(--border-primary) max-sm:h-1/2 max-sm:border-b sm:w-80 sm:min-w-80 sm:border-r">
                <PivotConfig />
            </div>
            <div className="flex-1 min-w-0 min-h-0">
                <FieldsCollection />
            </div>
        </div>
    );

    if (hasFieldSelected) {
        return (
            <Splitter layout="vertical" className="flex-1 border-t border-(--border-primary)">
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
