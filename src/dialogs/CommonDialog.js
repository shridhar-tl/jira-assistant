import React from 'react';
import BaseDialog from './BaseDialog';
import { Button } from '../controls';

class CommonDialog extends BaseDialog {
    constructor(props) {
        super(props);
        this.state = { showDialog: false };
        this.style = { width: "485px" };

        DialogConfig.onChange((body, title, footer, onClose) => {
            this.onClose = onClose;

            if (body) {
                this.title = title;
                this.body = body;
                this.getFooter = () => footer;
                this.setState({ showDialog: true });
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
    }

    render() {
        const { body } = this;

        if (typeof body === "string") {
            return super.renderBase(<div className="pad-22" dangerouslySetInnerHTML={{ __html: body }}></div>);
        }
        else {
            return super.renderBase(<div className="pad-22">{body}</div>);
        }
    }
}

export default CommonDialog;

class DialogConfig {
    static onChange(e) {
        DialogConfig.changeEvent = e;
    }

    custom(message, title, footer) {
        if (message && typeof message === "string") {
            message = message.replace(/\n/g, "<br />");
        }
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

            DialogConfig.changeEvent(message, title, footer, whenHide);
        });

        return { then };
    }

    setScope(scope) {
        this.tmpScope = scope;
    }

    hide() {
        DialogConfig.changeEvent();
    }

    alert(message, title) {
        if (!title) {
            title = "Info";
        }

        const footer = (ok) => <Button type="success" icon="fa fa-check" label="Ok" onClick={ok} />;
        return this.custom(message, title, footer);
    }

    confirmDelete(message, title) {
        if (!title) {
            title = "Confirm delete";
        }

        const footer = (confirm, cancel) => <>
            <Button icon="fa fa-times" label="Cancel" onClick={cancel} />
            <Button type="danger" icon="fa fa-trash" label="Delete" onClick={confirm} />
        </>;

        return this.custom(message, title, footer);
    }

    yesNo(message, title) {
        if (!title) {
            title = "Confirm";
        }

        const footer = (yes, no) => <>
            <Button icon="fa fa-times" label="No" onClick={no} />
            <Button type="danger" icon="fa fa-check" label="Yes" onClick={yes} />
        </>;

        return this.custom(message, title, footer);
    }

    okCancel(message, title) {
        if (!title) {
            title = "Confirm";
        }

        const footer = (ok, cancel) => <>
            <Button icon="fa fa-times" label="Cancel" onClick={cancel} />
            <Button type="danger" icon="fa fa-check" label="Ok" onClick={ok} />
        </>;

        return this.custom(message, title, footer);
    }
}

export const Dialog = new DialogConfig();