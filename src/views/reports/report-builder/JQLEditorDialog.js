import React from 'react';
import BaseDialog from '../../../dialogs/BaseDialog';
import { Button } from '../../../controls';
import QueryEditor from '../custom-report/QueryEditor';
import { inject } from '../../../services/injector-service';

class JQLEditorDialog extends BaseDialog {
    constructor(props) {
        super(props, "Select dataset fields");
        inject(this, "JiraService", "ReportConfigService");

        this.style = { width: "900px" };
        const { filterQuery } = props;
        this.state = { showDialog: true, filterQuery };
    }

    onDone = () => {
        const query = this.state.filterQuery;

        this.$jira.searchTickets(this.$reportConfig.prepareJQL(query.jql), query.outputFields.map(f => f.id))
            .then(data => this.props.onResolve(query, data));
    };

    queryChanged = (filterQuery) => this.setState({ filterQuery });

    getFooter() {
        let isSaveEnabled = false;

        if (this.editorInstance) {
            isSaveEnabled = this.editorInstance.isSaveEnabled();
        }

        return <>
            <Button type="default" icon="fa fa-times" onClick={this.onHide} label="Cancel" />
            <Button type="primary" icon="fa fa-check" onClick={this.onDone} label="Add" disabled={!isSaveEnabled} />
        </>;
    }

    getRef = (inst) => this.editorInstance = inst;

    render() {
        const { state: { filterQuery } } = this;

        return super.renderBase(
            <QueryEditor ref={this.getRef} builderOnly={true} reportQuery={filterQuery} onChange={this.queryChanged} />
        );
    }
}

export default JQLEditorDialog;