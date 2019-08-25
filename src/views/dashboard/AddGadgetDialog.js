import React from 'react';
import { GadgetList } from '../../gadgets';
import Button from '../../controls/Button';
import BaseDialog from '../../dialogs/BaseDialog';
import './AddGadgetDialog.scss';

class AddGadgetDialog extends BaseDialog {
    constructor(props) {
        super(props, "Manage gadgets");
        this.style = { width: '700px' };
        this.state.widgets = props.widgetsList;
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
        const { widgets } = this.state;

        return super.renderBase(
            <>
                {GadgetList.map(g => {
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
