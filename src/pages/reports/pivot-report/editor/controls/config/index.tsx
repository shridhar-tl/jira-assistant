import { Sortable } from '@controls';

import { addField, setFields } from '../../../store/field-actions';
import { usePivotConfig } from '../../../store/pivot-config';

import ColConfigItem from './ColItem';
import RowConfigItem from './RowItem';

export default function PivotConfig() {
    return (
        <div className="p-4">
            <FieldsConfig />
        </div>
    );
}

const accept = ['jira-field'];

function FieldsConfig() {
    const fields = usePivotConfig(({ fields }) => fields);

    return (
        <div>
            <strong className="block mb-2 text-sm font-semibold">Report Fields</strong>
            <Sortable
                placeholder={
                    <div className="text-sm text-[--text-tertiary] p-4 border border-dashed border-[--border-primary] rounded">
                        Drag and drop required fields from list to be shown in report
                    </div>
                }
                provideDragRef
                items={fields}
                accept={accept}
                itemType="row-group"
                onDrop={addField}
                onChange={setFields}
            >
                {(item: any, index: number, { draggable }: any) =>
                    item.colGroup ? (
                        <ColConfigItem key={index} item={item} index={index} dragProps={draggable} depth={0} path={`fields.${index}`} />
                    ) : (
                        <RowConfigItem key={index} index={index} item={item} depth={0} dragProps={draggable} />
                    )
                }
            </Sortable>
        </div>
    );
}
