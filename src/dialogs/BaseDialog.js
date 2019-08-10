import React, { PureComponent } from 'react';
import { Dialog } from 'primereact/dialog';

class BaseDialog extends PureComponent {
    constructor(props, title) {
        super(props);
        this.title = title;
        this.style = { width: "50vw" };
        this.state = { showDialog: true };
    }

    onHide = (prop) => {
        this.setState({ showDialog: false })

        var { onHide } = this.props;
        if (onHide) {
            onHide(prop);
        }
    }

    renderBase(children) {
        var {
            style, className, title, onHide,
            state: { showDialog } } = this;

        var footer = null;
        if (this.getFooter) {
            footer = this.getFooter();
        }

        return (
            <Dialog header={title} footer={footer} appendTo={document.body} visible={showDialog} style={style} className={className} modal={true} onHide={onHide} baseZIndex={1035}>
                {children}
            </Dialog>
        );
    }
}

export default BaseDialog;