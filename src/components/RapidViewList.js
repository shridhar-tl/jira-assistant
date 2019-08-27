import React, { PureComponent } from 'react';
import { AutoComplete } from '../controls';
import { inject } from '../services';

class RapidViewList extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService");

        this.state = {};
    }

    UNSAFE_componentWillMount() {
        return this.$jira.getRapidViews().then((views) => {
            const rapidViews = views.orderBy((d) => { return d.name; }).map((d) => {
                return { name: d.name, id: d.id };
            });
            this.setState({ rapidViews });
        });
    }

    searchRapidView = (query) => {
        query = (query || '').toLowerCase();

        const { state: { rapidViews }, props: { value } } = this;

        return rapidViews.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.id.toString().startsWith(query))
            && (!value || !value.some(v => v.id === r.id)));
    }

    setValue = (val) => {
        this.props.onChange(val);
    }

    render() {
        const { state: { rapidViews }, props: { value, placeholder } } = this;

        return (
            <AutoComplete value={value} onChange={this.setValue}
                dataset={this.searchRapidView} dropdown={true} multiple={true} displayField="name"
                placeholder={placeholder || "start typing the board name here"}
                size={35} maxlength={25} styleclass="autocomplete-350" scrollHeight="300px"
                disabled={!rapidViews || rapidViews.length === 0} />
        );
    }
}

export default RapidViewList;