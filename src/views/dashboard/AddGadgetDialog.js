import React, { PureComponent } from 'react';
import { Dialog } from 'primereact/dialog';
import { GadgetList } from '../../gadgets';
import Button from '../../controls/Button';
import './AddGadgetDialog.scss';

const DIALOG_STYLE = { width: '700px' };

class AddGadgetDialog extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { showDialog: true };
    }

    onHide = () => {
        this.setState({ showDialog: false });
        this.props.onHide();
    }

    render() {
        var { onCheckIsAdded, addGadget, removeGadget } = this.props;
        var { showDialog } = this.state;

        var footer = <Button icon="fa fa-check" label="Done" onClick={this.onHide} />

        return (
            <Dialog header="Manage gadgets" footer={footer} visible={showDialog}
                style={DIALOG_STYLE} modal={true}
                onHide={this.onHide}>
                {GadgetList.map(g => {
                    var added = onCheckIsAdded(g.id);
                    return (
                        <div key={g.id} className="gadget-info">
                            <div className="icon"><i className={"fa " + g.icon}></i></div>
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
            </Dialog>
        );
    }
}

export default AddGadgetDialog;
