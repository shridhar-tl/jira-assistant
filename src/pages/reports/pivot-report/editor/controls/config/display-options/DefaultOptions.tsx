import { Checkbox, Dropdown } from '@components';
import type { ComponentEvent } from '@components';

import { updateItemByPath, useSelectedItemConfig } from '../../../../store/pivot-config';
import { canAllowDistinct, getFunctionsByType } from '../../../../utils/format-functions';
import { getFieldType } from '../../../../viewer/common-utils';
import PropertyRow from '../PropertyRow';

import { typeFormatMap } from './formatting';

interface DefaultOptionsProps {
    item: any;
    isGrouped?: boolean;
    isRow?: boolean;
}

const functionHelpText = 'How the values of the issues falling in the group are combined to be displayed in a cell.';

export default function DisplayOption({ item, isGrouped, isRow }: DefaultOptionsProps) {
    const { itemPath } = useSelectedItemConfig();
    const fieldType = getFieldType(item);
    const functions = !isGrouped && getFunctionsByType(fieldType, isRow);
    const allowDistinct = !isGrouped && canAllowDistinct(item.agrFunc);

    const formatting = typeFormatMap[fieldType || ''];

    const handleFieldChange = (field: string, value: unknown) => {
        updateItemByPath({ ...item, [field]: value }, null, { args: { itemPath, isRow } });
    };

    return (
        <>
            {functions && (
                <PropertyRow label="Aggregation function" helpText={functionHelpText}>
                    <Dropdown
                        value={item.agrFunc}
                        onChange={(e: ComponentEvent<string>) => handleFieldChange('agrFunc', e.value)}
                        options={functions}
                        placeholder={isRow ? 'No Aggregation' : 'First value'}
                    />
                    {allowDistinct && (
                        <Checkbox
                            checked={!!item.useDistinct}
                            onChange={({ value }: ComponentEvent<boolean>) => handleFieldChange('useDistinct', value)}
                            label="Count distinct values only"
                        />
                    )}
                </PropertyRow>
            )}

            {formatting && (
                <PropertyRow label="Display format">
                    <Dropdown
                        value={item.format}
                        onChange={(e: ComponentEvent<string>) => handleFieldChange('format', e.value)}
                        options={formatting}
                        placeholder="Default"
                    />
                </PropertyRow>
            )}
        </>
    );
}
