import React from 'react';
import BaseDialog from './BaseDialog';
import { Button } from '../controls';

class CommonDialog extends BaseDialog {
    constructor(props) {
        super(props);
        this.state = { showDialog: false };
        this.style = { width: "485px" };

        DialogConfig.onChange((body, title, footer) => {
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

    render() {
        const { body } = this;

        return super.renderBase(<div className="pad-22">{body}</div>);
    }
}

export default CommonDialog;

class DialogConfig {
    static onChange(e) {
        DialogConfig.changeEvent = e;
    }

    custom(message, title, footer) {
        const then = ((confirm, cancel) => {
            if (typeof footer === "function") {
                footer = footer(
                    () => {
                        this.hide();
                        if (confirm) { confirm(this.scope); }
                    },
                    () => {
                        this.hide();
                        if (cancel) {
                            cancel(this.scope);
                        }
                    }
                );
            }

            this.scope = this.tmpScope;
            this.tmpScope = null;

            DialogConfig.changeEvent(message, title, footer);
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

        const footer = (ok) => <Button type="danger" icon="fa fa-check" label="Delete" onClick={ok} />;
        return this.custom(message, footer);
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