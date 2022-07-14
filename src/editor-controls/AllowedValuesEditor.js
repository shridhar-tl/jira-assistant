import AutoCompleteEditor from './AutoCompleteEditor';

class AllowedValuesEditor extends AutoCompleteEditor {
    search = (qry) => {
        const qryToLower = qry.toLowerCase();
        const { dataset } = this.props;
        return dataset.filter(p => `${p.key} - ${p.name}`.toLowerCase().indexOf(qryToLower) > -1)
            .map(item => {
                const { id, key, name, iconUrl } = item;
                return {
                    value: key || id,
                    label: key ? `${key} - ${name}` : name,
                    displayText: name,
                    iconUrl
                };
            });
    };
}

export default AllowedValuesEditor;