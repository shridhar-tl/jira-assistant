import React, { PureComponent } from 'react';
import { Dialog } from 'primereact/dialog';
import { inject, readyToInject } from '../services';
import { EventCategory } from '../constants/settings';
import './CommonStyles.scss';

class BaseDialog extends PureComponent {
    constructor(props, title) {
        super(props);
        if (readyToInject()) {
            inject(this, "AnalyticsService");
        }
        this.title = title;
        this.style = { width: "50vw" };
        this.state = { showDialog: true };
        this.$analytics?.trackEvent("Dialog opened", EventCategory.DialogEvents, title);
    }

    onHide = (prop) => {
        // Do not send prop in onHide event callback if it is an event
        if (prop && prop.nativeEvent) {
            prop = null;
        }

        const { onHide } = this.props;
        if (onHide) {
            onHide(prop);
        }
        this.setState({ showDialog: false });
    };

    renderBase(children) {
        const {
            style, className, title, onHide,
            state: { showDialog } } = this;

        let footer = null;
        if (this.getFooter) {
            footer = this.getFooter();
        }

        return (
            <Dialog header={title} footer={footer} showHeader={!!title} dismissableMask={!title} closeOnEscape={!title}
                appendTo={document.body} visible={showDialog} style={style} className={className} modal={true} onHide={onHide} baseZIndex={1035}>
                {children}
            </Dialog>
        );
    }
}

export default BaseDialog;