import React from 'react';
import BaseDialog from "../../../dialogs/BaseDialog";
import { TextBox, Checkbox, Button } from '../../../controls';

class SaveReportDialog extends BaseDialog {
    constructor(props) {
        super(props, "Save Query As");
        this.style = { width: "350px" };
        this.state = { showDialog: true, newQueryName: props.queryName || "", copyQuery: false };
    }

    nameChanged = (newQueryName) => this.setState({ newQueryName })
    copyChanged = (copyQuery) => this.setState({ copyQuery })

    done = () => {
        const { newQueryName, copyQuery } = this.state;
        this.props.onChange(newQueryName, copyQuery);
    }

    getFooter() {
        const {
            state: { newQueryName }
        } = this;

        return <>
            <Button type="secondary" label="Cancel" onClick={this.onHide} />
            <Button type="primary" icon="fa fa-floppy-o" label="Save"
                disabled={!newQueryName || newQueryName.length < 3}
                onClick={this.done} />
        </>;
    }

    render() {
        const {
            props: { allowCopy },
            state: { newQueryName, copyQuery }
        } = this;

        return super.renderBase(
            <div className="pad-15">
                <label>Query Name</label>
                <p><TextBox value={newQueryName} onChange={this.nameChanged} style={{ width: "100%" }} /></p>
                {allowCopy && <p><Checkbox checked={copyQuery} onChange={this.copyChanged} label="Create as a new query" /></p>}
            </div>
        );
    }
}

export default SaveReportDialog;