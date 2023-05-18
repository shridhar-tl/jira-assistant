import { useEffect, useState } from "react";
import { AutoComplete, SelectBox } from "../controls";
import { inject } from "../services";

function Workspace({ value, multiple = true,
    placeholder = 'start typing the workspace name here',
    onChange }) {
    const [spaces, setSpaces] = useState([]);

    useEffect(() => {
        getSpaces().then(setSpaces);
    }, []);

    const search = (query) => {
        query = (query || '').toLowerCase();

        return spaces.filter(r => (r.name.toLowerCase().includes(query) || r.key.toLowerCase().startsWith(query))
            && (!value || !value.some(v => v.key === r.key)));
    };

    if (multiple) {
        return (
            <AutoComplete value={value} onChange={onChange}
                dataset={search} dropdown={true} multiple={multiple} displayField="name"
                placeholder={placeholder}
                size={35} maxLength={25} styleclass="autocomplete-350" scrollHeight="300px"
                disabled={!spaces.length} />
        );
    } else {
        return (<SelectBox value={value} dataset={spaces} displayField="name"
            onChange={onChange} />);
    }
}

export default Workspace;

function getSpaces() {
    const { $wiki } = inject('ConfluenceService');
    return $wiki.getSpaces();
}