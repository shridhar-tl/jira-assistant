import { useEffect, useState } from "react";
import { AutoComplete, SelectBox } from "../controls";
import { inject } from "../services";

function WikiCalendar({ value, multiple = true, workspace, field,
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
                dataset={search} dropdown={true} multiple={multiple} displayField="name" field={field}
                placeholder={placeholder}
                size={35} maxLength={25} styleclass="autocomplete-350" scrollHeight="300px"
                disabled={!calendars.length} />
        );
    } else {
        return (<SelectBox value={value} dataset={calendars} displayField="name"
            onChange={onChange} field={field} />);
    }
}

export default WikiCalendar;

async function getCalendars(workspaces) {
    const { $wiki } = inject('ConfluenceService');
    const calendars = await $wiki.getCalendars(workspaces);

    return calendars.reduce((arr, { result }) => {
        if (Array.isArray(result)) {
            arr.push(...result);
        }
        return arr;
    }, []);
}