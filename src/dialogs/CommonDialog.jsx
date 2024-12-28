import React from 'react';
import BaseDialog from './BaseDialog';
import { Button } from '../controls';
import { parseHTML } from '../common/utils';
import { EventCategory } from '../constants/settings';

class CommonDialog extends BaseDialog {
    constructor(props) {
        super(props);
        this.state = { showDialog: false };
        this.style = { width: "485px" };

        DialogConfig.onChange((body, title, footer, onClose, style, dialogId) => {
            style = style || {};
            this.onClose = onClose;
            this.style = { ...this.style, ...style };
            this.className = dialogId;

            if (body) {
                this.title = title;
                this.body = body;
                this.getFooter = () => footer;
                this.setState({ showDialog: true });

                this.$analytics?.trackEvent("Dialog opened", EventCategory.DialogEvents, title);
            }
            else {
                this.setState({ showDialog: false });
            }
        });
    }

    onHide = () => {
        if (this.onClose) {
            this.onClose();
        }
        this.style = { width: "485px" };
    };

    parseMarkupString(body) {
        if (typeof body === "string") {
            return parseHTML(body); // ToDo: Will have to parse string in a different way to support markup
        }

        return body;
    }

    render() {
        const { body } = this;

        return super.renderBase(<div className="pad-22">{this.parseMarkupString(body)}</div>);
    }
}

export default CommonDialog;

class DialogConfig {
    static onChange(e) {
        DialogConfig.changeEvent = e;
    }

    custom(message, title, footer, styles, dialogId = 'dlg-custom') {
        /*
        Commented this line as html is handled in CommonDialog class
        if (message && typeof message === "string") {
            message = message.replace(/\n/g, "<br />");
        }*/
        const then = ((confirm, cancel) => {
            const whenHide = () => {
                this.hide();
                if (cancel) {
                    cancel(this.scope);
                }
            };

            if (typeof footer === "function") {
                footer = footer(
                    () => {
                        this.hide();
                        if (confirm) { confirm(this.scope); }
                    },
                    whenHide
                );
            }

            this.scope = this.tmpScope;
            this.tmpScope = null;

            DialogConfig.changeEvent(message, title, footer, whenHide, styles, dialogId);
        });

        return { then };
    }

    setScope(scope) {
        this.tmpScope = scope;
    }

    hide() {
        DialogConfig.changeEvent();
    }

    alert(message, title, styles, config) {
        if (!title) {
            title = "Info";
        }

        const footer = (ok) => <Button waitFor={config?.waitFor} type="success" icon="fa fa-check" label={config?.acceptLabel || 'Ok'} onClick={ok} />;
        return this.custom(message, title, footer, styles, 'dlg-alert');
    }

    confirmDelete(message, title, styles, config) {
        if (!title) {
            title = "Confirm delete";
        }

        const footer = (confirm, cancel) => <>
            <Button text icon="fa fa-times" label="Cancel" onClick={cancel} />
            <Button type="danger" icon="fa fa-trash" label="Delete" onClick={confirm} waitFor={config?.waitFor} />
        </>;

        return this.custom(message, title, footer, styles, 'dlg-delete');
    }

    yesNo(message, title, styles) {
        if (!title) {
            title = "Confirm";
        }

        const footer = (yes, no) => <>
            <Button text icon="fa fa-times" label="No" onClick={no} />
            <Button type="danger" icon="fa fa-check" label="Yes" onClick={yes} />
        </>;

        return this.custom(message, title, footer, styles, 'dlg-yesNo');
    }

    okCancel(message, title, styles) {
        if (!title) {
            title = "Confirm";
        }

        const footer = (ok, cancel) => <>
            <Button text icon="fa fa-times" label="Cancel" onClick={cancel} />
            <Button type="danger" icon="fa fa-check" label="Ok" onClick={ok} />
        </>;

        return this.custom(message, title, footer, styles, 'dlg-okCancel');
    }
}

export const Dialog = new DialogConfig();