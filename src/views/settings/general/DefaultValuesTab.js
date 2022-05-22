import React from 'react';
import TabControlBase from './TabControlBase';
import { SelectBox, AutoComplete } from '../../../controls';
import { inject } from '../../../services';

class DefaultValuesTab extends TabControlBase {
    constructor(props) {
        super(props);
        inject(this, "JiraService");
        this.state = { settings: props.settings };
        this.loadData();
    }

    async loadData() {
        this.$jira.getRapidViews().then((rapidViews) => {
            rapidViews = rapidViews.orderBy((d) => { return d.name; }).map((d) => {
                return { name: d.name, id: d.id };
            });

            this.setState({ rapidViews });

            //if (settings.rapidViews && settings.rapidViews.length > 0) {
            //  settings.rapidViews = this.rapidViews
            //}
        });

        this.$jira.getProjects().then((projects) => {
            projects = projects.map((d) => { return { name: d.name, id: d.id, key: d.key }; }).orderBy((d) => d.name);
            this.setState({ projects });
        });

        this.$jira.getCustomFields().then(cfList => {
            const numericFields = cfList.filter(cf => cf.custom && cf.schema.type === "number")
                .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                .orderBy(cf => cf.name);

            const stringFields = cfList.filter(cf => cf.custom && (cf.schema.type === "any" || cf.schema.type === "string"))
                .map(cf => { return { id: cf.id, name: cf.name, clauseNames: cf.clauseNames }; })
                .orderBy(cf => cf.name);

            this.setState({ numericFields, stringFields });
            this.setDefaultValues(numericFields, stringFields);
        });
    }

    searchRapidView = (query) => {
        query = (query || '').toLowerCase();
        const { rapidViews, settings } = this.state;
        return rapidViews.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.id.toString().startsWith(query))
            && (!settings.rapidViews || !settings.rapidViews.some(v => v.id === r.id)));
    };

    searchProject = (query) => {
        query = (query || '').toLowerCase();
        const { projects, settings } = this.state;
        return projects.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.key.toLowerCase().startsWith(query) || r.id.toString().startsWith(query))
            && (!settings.projects || !settings.projects.some(v => v.id === r.id)));
    };

    setDefaultValues(numericFields, stringFields) {
        const { settings, } = this.state;
        const { storyPointField, epicNameField } = settings;

        if (!storyPointField) {
            // Find the field with exact match
            const spF = numericFields.first(cf => cf.name.toLowerCase() === "story points");
            // IF exact match is not available then find a field with both the words
            if (!spF) {
                numericFields.first(cf => {
                    const name = cf.name.toLowerCase();
                    return name.indexOf('story') > -1 && ~name.indexOf('points') > -1;
                });
            }
            if (spF) {
                this.saveSetting(spF, "storyPointField");
            }
        }

        if (!epicNameField) {
            // Find the field with exact match
            const enF = stringFields.first(cf => cf.name.toLowerCase() === "epic link");
            // IF exact match is not available then find a field with both the words
            if (!enF) {
                stringFields.first(cf => {
                    const name = cf.name.toLowerCase();
                    return name.indexOf('epic') > -1 && ~name.indexOf('link') > -1;
                });
            }

            if (enF) {
                this.saveSetting(enF, "epicNameField");
            }
        }
    }

    render() {
        const { state: { settings, numericFields, stringFields, projects, rapidViews } } = this;

        return (<>
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Projects</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <AutoComplete value={settings.projects} field="projects" onChange={this.saveSetting}
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
                        <AutoComplete value={settings.rapidViews} field="rapidViews" onChange={this.saveSetting}
                            dataset={this.searchRapidView} dropdown={true} multiple={true} displayField="name"
                            placeholder="start typing the board name here"
                            size={35} maxLength={25} styleclass="autocomplete-350" scrollHeight="300px"
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
                        <SelectBox dataset={numericFields} value={settings.storyPointField} field="storyPointField" onChange={this.saveSetting}
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
                        <SelectBox dataset={stringFields} value={settings.epicNameField} field="epicNameField" onChange={this.saveSetting}
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