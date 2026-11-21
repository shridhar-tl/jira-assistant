import type { PivotFieldConfig } from '../../../types';
import { isFieldUnavailable } from '../../../utils/field-references';
import { useFieldsList } from '../../../utils/fields';

interface UnavailableFieldIconProps {
    item: Pick<PivotFieldConfig, 'id' | 'key' | 'schema'>;
}

export default function UnavailableFieldIcon({ item }: UnavailableFieldIconProps) {
    const isUnavailable = useFieldsList(({ fieldsMap }) => isFieldUnavailable(item, fieldsMap));

    if (!isUnavailable) {
        return null;
    }

    return (
        <span
            className="fa fa-triangle-exclamation text-xs text-(--color-error)"
            title="This field is not available in this Jira instance. Remove it or replace it with an equivalent field"
        />
    );
}
