import React, { PureComponent } from 'react';
import { AutoComplete } from '../controls';
import { inject } from '../services';

class SprintList extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService");

        this.state = {};
        this.pullSprintList(props);
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (this.rapidViews !== props.rapidViews) {
            this.pullSprintList(props);
        }
    }

    pullSprintList = (props) => {
        const { rapidViews } = props;

        this.rapidViews = rapidViews;

        if (!rapidViews || rapidViews.length === 0) {
            this.setState({ sprints: null });
            this.props.onChange([]);
            return;
        }

        const selectedRapidIds = rapidViews.map(r => r.id);

        let { value } = props;
        if (value && value.length > 0) {
            value = [...value];

            value.removeAll(s => selectedRapidIds.indexOf(s.rapidId) === -1);
            this.props.onChange(value);
        }

        this.$jira.getRapidSprintList(selectedRapidIds).then((sprints) => {
            sprints = sprints.orderByDescending(s => s.id);
            sprints.forEach((s) => {
                if (!s.stateAppended) {
                    s.stateAppended = true;
                    s.name += (` - (${s.state})` || "");
                }
            });
            this.setState({ sprints });
        });
    }

    searchSprints = (query) => {
        query = (query || '').toLowerCase();

        const { value } = this.props;
        const sprintIds = value && value.map(v => v.id);

        return this.state.sprints.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.id.toString().startsWith(query))
            && (!sprintIds || sprintIds.indexOf(r.id) === -1));
    }

    setValue = (value) => {
        this.props.onChange(value);
    }

    render() {
        const { state: { sprints }, props: { value, placeholder } } = this;

        return (
            <AutoComplete value={value} onChange={this.setValue}
                dataset={this.searchSprints} dropdown={true} multiple={true} displayField="name"
                placeholder={placeholder || "start typing the sprint name here"}
                size={35} maxlength={25} styleclass="autocomplete-350" scrollHeight="300px"
                disabled={!sprints || sprints.length === 0} />
        );
    }
}

export default SprintList;