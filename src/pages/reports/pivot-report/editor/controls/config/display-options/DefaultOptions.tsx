import { Checkbox, Dropdown } from '@components';
import type { ComponentEvent } from '@components';

import { updateItemByPath, useSelectedItemConfig } from '../../../../store/pivot-config';
import { canAllowDistinct, getFunctionsByType } from '../../../../utils/format-functions';

import { typeFormatMap } from './formatting';

interface DefaultOptionsProps {
    item: any;
    isGrouped?: boolean;
    isRow?: boolean;
}

export default function DisplayOption({ item, isGrouped, isRow }: DefaultOptionsProps) {
    const { itemPath } = useSelectedItemConfig();
    const functions = !isGrouped && getFunctionsByType(item.schema?.type, isRow);
    const allowDistinct = !isGrouped && canAllowDistinct(item.agrFunc);

    const formatting = typeFormatMap[item.schema?.type || ''];

    const handleFieldChange = (field: string, value: any) => {
        updateItemByPath({ ...item, [field]: value }, null, { args: { itemPath, isRow } });
    };

    return (
        <div className="space-y-3">
            {functions && (
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium min-w-24">Function:</label>
                    <div className="flex-1">
                        <Dropdown value={item.agrFunc} onChange={(e: ComponentEvent<string>) => handleFieldChange('agrFunc', e.value)} options={functions} />
                    </div>
                </div>
            )}
            {allowDistinct && (
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={item.useDistinct}
                        onChange={({ value }: any) => handleFieldChange('useDistinct', value)}
                        label="Use distinct values only"
                        disabled
                    />
                </div>
            )}

            {formatting && (
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium min-w-24">Formatting:</label>
                    <div className="flex-1">
                        <Dropdown value={item.format} onChange={(e: ComponentEvent<string>) => handleFieldChange('format', e.value)} options={formatting} />
                    </div>
                </div>
            )}
        </div>
    );
}
