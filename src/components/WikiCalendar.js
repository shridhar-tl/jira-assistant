import { useEffect, useState } from "react";
import { AutoComplete, SelectBox } from "../controls";
import { inject } from "../services";

function WikiCalendar({ value, multiple = true, workspace,
    placeholder = 'start typing the calendar name here',
    onChange }) {
    const [calendars, setCalendars] = useState([]);

    useEffect(() => {
        if (workspace?.length) {
            getCalendars(workspace.map(s => s.key)).then(setCalendars);
        } else {
            setCalendars([]);
        }
    }, [workspace]);

    const search = (query) => {
        query = (query || '').toLowerCase();

        return calendars.filter(r => (r.name.toLowerCase().includes(query))
            && (!value || !value.some(v => v.id === r.id)));
    };

    if (multiple) {
        return (
            <AutoComplete value={value} onChange={onChange} optionGroupLabel="name" optionGroupChildren="items"
                dataset={search} dropdown={true} multiple={multiple} displayField="name"
                placeholder={placeholder}
                size={35} maxLength={25} styleclass="autocomplete-350" scrollHeight="300px"
                disabled={!calendars.length} />
        );
    } else {
        return (<SelectBox value={value} dataset={calendars} displayField="name"
            onChange={onChange} />);
    }
}

export default WikiCalendar;

function getCalendars(workspaces) {
    const { $wiki } = inject('ConfluenceService');
    return $wiki.getCalendars(workspaces);
}