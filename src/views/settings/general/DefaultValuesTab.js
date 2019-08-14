import React from 'react';
import TabControlBase from './TabControlBase';
import { SelectBox, AutoComplete } from '../../../controls';
import { inject } from '../../../services';

class DefaultValuesTab extends TabControlBase {
    constructor(props) {
        super(props);
        inject(this, "JiraService");
        this.state = {};
    }

    UNSAFE_componentWillMount() {
        this.$jira.getRapidViews().then((rapidViews) => {
            rapidViews = rapidViews.orderBy((d) => { return d.name; }).map((d) => {
                return { name: d.name, id: d.id };
            });

            this.setState({ rapidViews });

            //if (this.props.settings.rapidViews && this.props.settings.rapidViews.length > 0) {
            //  this.props.settings.rapidViews = this.rapidViews
            //}
        });
        this.$jira.getProjects().then((projects) => {
            projects = projects.map((d) => { return { name: d.name, id: d.id, key: d.key }; }).orderBy((d) => d.name);
            this.setState({ projects });
        });
        this.$jira.getCustomFields().then(cfList => {
            var numericFields = cfList.filter(cf => cf.custom && cf.schema.type === "number")
                .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                .orderBy(cf => cf.name);

            var stringFields = cfList.filter(cf => cf.custom && (cf.schema.type === "any" || cf.schema.type === "string"))
                .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                .orderBy(cf => cf.name);

            this.setState({ numericFields, stringFields });
        });
    }

    searchRapidView = (query) => {
        query = (query || '').toLowerCase();
        return this.state.rapidViews.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.id.toString().startsWith(query))
            && (!this.props.settings.rapidViews || !this.props.settings.rapidViews.some(v => v.id === r.id)));
    }

    searchProject = (query) => {
        query = (query || '').toLowerCase();
        return this.state.projects.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.key.toLowerCase().startsWith(query) || r.id.toString().startsWith(query))
            && (!this.props.settings.projects || !this.props.settings.projects.some(v => v.id === r.id)));
    }

    render() {
        var {
            props: { settings },
            state: { numericFields, stringFields, projects, rapidViews }
        } = this;

        return (<>
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Projects</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <AutoComplete value={settings.projects} onChange={(val) => this.setValue("projects", val)}
                            dataset={this.searchProject} dropdown={true} multiple={true} displayField="name"
                            placeholder="start typing the project name here" size={35}
                            maxlength={25} className="autocomplete-350" scrollHeight="300px"
                            disabled={!projects || projects.length === 0} />
                        <span className="help-block">Add one or more projects which you are interested in</span>
                    </div>
                </div>
            </div>
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Rapid board</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <AutoComplete value={settings.rapidViews} onChange={(val) => this.setValue("rapidViews", val)}
                            dataset={this.searchRapidView} dropdown={true} multiple={true} displayField="name"
                            placeholder="start typing the board name here"
                            size={35} maxlength={25} styleclass="autocomplete-350" scrollHeight="300px"
                            disabled={!rapidViews || rapidViews.length === 0} />
                        <span className="help-block">Add one or more rapid view board which you are interested in</span>
                    </div>
                </div>
            </div>
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Story Points field</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <SelectBox dataset={numericFields} value={settings.storyPointField} onChange={(val) => this.setValue("storyPointField", val)}
                            style={{ 'width': '200px' }} placeholder="Choose a storypoint field" disabled={!numericFields}
                            displayField="name" filterPlaceholder="Type the field name to filter" />
                        <span className="help-block">Story points field is a custom field in each jira instance and for some functionality to work,
                                you will have to select appropriate field.</span>
                    </div>
                </div>
            </div>
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Epic name field</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <SelectBox dataset={stringFields} value={settings.epicNameField} onChange={(val) => this.setValue("epicNameField", val)}
                            style={{ 'width': '200px' }} placeholder="Choose a epic name field" disabled={!stringFields}
                            displayField="name" filterPlaceholder="Type the field name to filter" />
                        <span className="help-block">Epic name field is a custom field in each jira instance and for some functionality to work,
                                 you will have to select appropriate field.</span>
                    </div>
                </div>
            </div>
        </>
        );
    }
}

export default DefaultValuesTab;