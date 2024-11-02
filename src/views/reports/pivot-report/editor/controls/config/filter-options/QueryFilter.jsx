import React from 'react';
import { FormTextBox } from 'react-controls/controls/form';
import { validateFilterText } from './validators';
import { useFieldsList } from 'src/views/reports/pivot-report/utils/fields';

function QueryFilter({ filterText }) {
    return (<div className="label-value-pair">
        <label>Filter Query:</label>
        <FormTextBox className="w-100" field="filter" multiline />
        <FilterValidator filterText={filterText} />
    </div>);
}

export default QueryFilter;

function FilterValidator({ filterText }) {
    const [state, setState] = React.useState({});
    const fieldsMap = useFieldsList(f => f.fieldsMap);
    const ref = React.useRef(fieldsMap);
    ref.current = fieldsMap;

    React.useEffect(() => {
        if (!filterText?.trim()) {
            setState({});
        } else {
            const scope = {
                fieldsMap: ref.current,
                fields: {},
                parameters: {}
            };
            setState(validateFilterText(filterText, scope));
        }
    }, [filterText, setState]);

    if (state.isValid) {
        return null;
    }

    return (<div className="msg-error">{state.errorMessage}</div>);
}
