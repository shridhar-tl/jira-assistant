import React from 'react';
import { GadgetList } from '../../gadgets';
import Button from '../../controls/Button';
import BaseDialog from '../../dialogs/BaseDialog';
import './AddGadgetDialog.scss';
import { inject } from '../../services';

class AddGadgetDialog extends BaseDialog {
    constructor(props) {
        super(props, "Manage gadgets");
        inject(this, "ReportService");
        this.style = { width: '700px' };
        this.state.widgets = props.widgetsList;
        this.state.gadgetList = GadgetList;
    }

    UNSAFE_componentWillMount() {
        this.$report.getReportsList().then(reports => {
            if (reports && reports.length) {
                const list = reports.map(r => {
                    return {
                        id: (r.advanced ? "AR:" : "SQ:") + r.id,
                        icon: "fa fa-filter",
                        name: r.queryName,
                        details: (!r.advanced ? `${r.outputCount} columns displayed${r.filtersCount > 0 ? ` with ${r.filtersCount} filters` : ""} in table format` : "<no details available>")
                    };
                });

                const gadgetList = [...GadgetList, ...list];
                this.setState({ gadgetList });
            }
        });
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (this.state.widgets !== props.widgetsList) {
            this.setState({ widgets: props.widgetsList });
        }
    }

    getFooter() {
        return <Button icon="fa fa-check" label="Done" onClick={this.onHide} />;
    }

    render() {
        const { addGadget, removeGadget } = this.props;
        const { widgets, gadgetList } = this.state;

        return super.renderBase(
            <>
                {gadgetList.map(g => {
                    const added = widgets.some(w => w.name === g.id);

                    return (
                        <div key={g.id} className="gadget-info">
                            <div className="icon"><i className={`fa ${g.icon}`}></i></div>
                            <div className="details">
                                <span className="name">{g.name}</span>
                                <span className="desc">{g.details}</span>
                                <div className="params"></div>
                            </div>
                            <div className="controls">
                                {!added && <Button type="success" icon="fa fa-plus" label="Add gadget" onClick={() => addGadget(g.id)} />}
                                {added && <Button type="danger" icon="fa fa-times" label="Remove gadget" onClick={() => removeGadget(g.id)} />}
                            </div>
                        </div>
                    );
                })}
                <div className="clearfix"></div>
            </>
        );
    }
}

export default AddGadgetDialog;
