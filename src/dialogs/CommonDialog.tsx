import React, { ReactNode } from 'react';

import { Button } from '@components';

import { parseHTML } from '@utils/helpers';

import { EventCategory } from '../constants/settings';

import BaseDialog from './BaseDialog';

type DialogBody = string | ReactNode;
type DialogFooter = ReactNode | ((confirm: () => void, cancel: () => void) => ReactNode);
type DialogCallback = (scope?: any) => void;

interface DialogState {
    showDialog: boolean;
}

class CommonDialog extends BaseDialog<any, DialogState> {
    private body?: DialogBody;
    private onClose?: () => void;
    private scope?: any;
    private tmpScope?: any;

    constructor(props: any) {
        super(props);
        this.state = { showDialog: false };
        this.style = { width: '485px' };

        DialogConfig.onChange((body, title, footer, onClose, style, dialogId) => {
            style = style || {};
            this.onClose = onClose;
            this.style = { ...this.style, ...style };
            this.className = dialogId;

            if (body) {
                this.title = title || '';
                this.body = body;
                this.getFooter = () => footer;
                this.setState({ showDialog: true });

                this.$analytics?.trackEvent('Dialog opened', EventCategory.DialogEvents, title);
            } else {
                this.setState({ showDialog: false });
            }
        });
    }

    onHide = () => {
        if (this.onClose) {
            this.onClose();
        }
        this.style = { width: '485px' };
    };

    parseMarkupString(body: DialogBody): ReactNode {
        if (typeof body === 'string') {
            return parseHTML(body);
        }

        return body;
    }

    render() {
        const { body } = this;

        return this.renderBase(<div className="p-6">{this.parseMarkupString(body || '')}</div>);
    }
}

export default CommonDialog;

type ChangeEventHandler = (
    body?: DialogBody,
    title?: string,
    footer?: ReactNode,
    onClose?: () => void,
    styles?: React.CSSProperties,
    dialogId?: string,
) => void;

interface WaitForConfig {
    waitFor?: Promise<any>;
    acceptLabel?: string;
}

class DialogConfig {
    private static changeEvent?: ChangeEventHandler;
    private scope?: any;
    private tmpScope?: any;

    static onChange(handler: ChangeEventHandler): void {
        DialogConfig.changeEvent = handler;
    }

    custom(
        message: DialogBody,
        title?: string,
        footer?: DialogFooter,
        styles?: React.CSSProperties,
        dialogId = 'dlg-custom',
    ): { then: (confirm?: DialogCallback, cancel?: DialogCallback) => void } {
        const then = (confirm?: DialogCallback, cancel?: DialogCallback): void => {
            const whenHide = () => {
                this.hide();
                if (cancel) {
                    cancel(this.scope);
                }
            };

            let finalFooter: ReactNode;

            if (typeof footer === 'function') {
                finalFooter = footer(() => {
                    this.hide();
                    if (confirm) {
                        confirm(this.scope);
                    }
                }, whenHide);
            } else {
                finalFooter = footer;
            }

            this.scope = this.tmpScope;
            this.tmpScope = undefined;

            if (DialogConfig.changeEvent) {
                DialogConfig.changeEvent(message, title, finalFooter, whenHide, styles, dialogId);
            }
        };

        return { then };
    }

    setScope(scope: any): void {
        this.tmpScope = scope;
    }

    hide(): void {
        if (DialogConfig.changeEvent) {
            DialogConfig.changeEvent();
        }
    }

    alert(
        message: DialogBody,
        title?: string,
        styles?: React.CSSProperties,
        config?: WaitForConfig,
    ): { then: (confirm?: DialogCallback, cancel?: DialogCallback) => void } {
        if (!title) {
            title = 'Info';
        }

        const footer = (ok: () => void) => (
            <Button onClick={ok} variant="primary" leftIcon={<i className="fa fa-check" />}>
                {config?.acceptLabel || 'Ok'}
            </Button>
        );

        return this.custom(message, title, footer, styles, 'dlg-alert');
    }

    confirmDelete(
        message: DialogBody,
        title?: string,
        styles?: React.CSSProperties,
        config?: WaitForConfig,
    ): { then: (confirm?: DialogCallback, cancel?: DialogCallback) => void } {
        if (!title) {
            title = 'Confirm delete';
        }

        const footer = (confirm: () => void, cancel: () => void) => (
            <>
                <Button onClick={cancel} variant="secondary" leftIcon={<i className="fa fa-times" />}>
                    Cancel
                </Button>
                <Button onClick={confirm} variant="danger" leftIcon={<i className="fa fa-trash" />}>
                    Delete
                </Button>
            </>
        );

        return this.custom(message, title, footer, styles, 'dlg-delete');
    }

    yesNo(
        message: DialogBody,
        title?: string,
        styles?: React.CSSProperties,
    ): { then: (confirm?: DialogCallback, cancel?: DialogCallback) => void } {
        if (!title) {
            title = 'Confirm';
        }

        const footer = (yes: () => void, no: () => void) => (
            <>
                <Button onClick={no} variant="secondary" leftIcon={<i className="fa fa-times" />}>
                    No
                </Button>
                <Button onClick={yes} variant="danger" leftIcon={<i className="fa fa-check" />}>
                    Yes
                </Button>
            </>
        );

        return this.custom(message, title, footer, styles, 'dlg-yesNo');
    }

    okCancel(
        message: DialogBody,
        title?: string,
        styles?: React.CSSProperties,
    ): { then: (confirm?: DialogCallback, cancel?: DialogCallback) => void } {
        if (!title) {
            title = 'Confirm';
        }

        const footer = (ok: () => void, cancel: () => void) => (
            <>
                <Button onClick={cancel} variant="secondary" leftIcon={<i className="fa fa-times" />}>
                    Cancel
                </Button>
                <Button onClick={ok} variant="danger" leftIcon={<i className="fa fa-check" />}>
                    Ok
                </Button>
            </>
        );

        return this.custom(message, title, footer, styles, 'dlg-okCancel');
    }
}

export const Dialog = new DialogConfig();
export { CommonDialog as CustomDialog };
