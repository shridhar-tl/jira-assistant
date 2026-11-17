import { Sortable } from '@controls';

import { addField, setFields } from '../../../store/field-actions';
import { usePivotConfig } from '../../../store/pivot-config';

import ColConfigItem from './ColItem';
import RowConfigItem from './RowItem';

const accept = ['jira-field'];

const emptyFieldsPlaceholder = (
    <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-(--border-primary) px-4 py-8 text-center">
        <span className="fa fa-hand-pointer text-xl text-(--text-tertiary)" />
        <span className="text-sm font-medium text-(--text-secondary)">Drag and drop fields here</span>
        <span className="text-xs text-(--text-tertiary)">
            Fields are shown as rows by default. Select a field to group by it, aggregate it or show its values as columns.
        </span>
    </div>
);

export default function PivotConfig() {
    return (
        <div className="p-3 sm:p-4">
            <FieldsConfig />
        </div>
    );
}

function FieldsConfig() {
    const fields = usePivotConfig(({ fields }) => fields);

    return (
        <div>
            <div className="mb-3 flex items-center justify-between gap-2">
                <strong className="text-sm font-semibold text-(--text-primary)">Report fields</strong>
                {!!fields.length && <span className="text-xs text-(--text-tertiary)">Click a field to configure it</span>}
            </div>
            <Sortable
                placeholder={emptyFieldsPlaceholder}
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
