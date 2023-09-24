import React from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { fillFieldsList, useFieldsList } from '../../../utils/fields.js';
import { Draggable, TextBox } from 'src/controls';
import { useFieldFilterText } from '../../../store/pivot-config.js';
import { stop } from 'src/common/utils.js';
import './Style.scss';

function FieldsCollection() {
    const fields = useFieldsList(({ fields }) => fields);

    React.useEffect(() => { fillFieldsList(); }, []);

    return (<div className="fields-collection">
        <SearchBox />
        <TabView>
            {fields.map(f => <TabPanel key={f.label} header={f.label}>
                <FieldsList fields={f.items} />
            </TabPanel>)}
        </TabView>
    </div>);
}

export default FieldsCollection;

function SearchBox() {
    const { searchText, setSearchText } = useFieldFilterText();

    return (<div className="search-container">
        <span className="fa fa-search" />
        <TextBox value={searchText} placeholder="type here to search for fields..." onChange={setSearchText} />
    </div>);
}

function FieldsList({ fields }) {
    const searchText = useFieldFilterText(({ searchText }) => searchText)?.trim()?.toLowerCase();
    const [items, setItems] = React.useState(() => getFilteredFields(fields, searchText));

    React.useEffect(() => {
        setItems(getFilteredFields(fields, searchText));
    }, [searchText, fields, setItems]);

    return (<div className="fields-list">
        {items?.map((field, i) => (<Draggable key={i}
            className="jira-field"
            itemType="jira-field"
            item={field}
        >
            <span className="fa fa-copy float-end pointer" onClick={(e) => copyForFilter(e, field)}
                title="Click to copy field for query filter" />
            <span>{field.name}</span>
        </Draggable>))}
    </div>);
}

function getFilteredFields(fields, searchText) {
    if (!searchText) {
        return fields;
    }

    const filteredItems = fields.filter(f => f.name.toLowerCase().includes(searchText) || f.key.toLowerCase().includes(searchText));
    return filteredItems;
}

function copyForFilter(e, field) {
    stop(e);
    const value = field.custom ? field.name : field.key;

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value);
    }
}