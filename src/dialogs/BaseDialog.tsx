import React, { Component, ReactNode } from 'react';

import { inject } from '@services';

import { Modal } from '@components';

import { EventCategory } from '../constants/settings';
import type AnalyticsService from '../services/analytics-service';

interface BaseDialogProps {
    onHide?: (result?: any) => void;
    [key: string]: any;
}

interface BaseDialogState {
    showDialog: boolean;
    [key: string]: any;
}

class BaseDialog<P extends BaseDialogProps = BaseDialogProps, S extends BaseDialogState = BaseDialogState> extends Component<P, S> {
    protected title: string;
    protected style: React.CSSProperties;
    protected className?: string;
    protected $analytics?: AnalyticsService;

    constructor(props: P, title?: string) {
        super(props);

        const services = inject('AnalyticsService');
        this.$analytics = services.$analytics;

        this.title = title || '';
        this.style = { width: '50vw' };
        this.state = { showDialog: true } as S;

        if (this.title) {
            this.$analytics?.trackEvent('Dialog opened', EventCategory.DialogEvents, title);
        }
    }

    onHide = (prop?: any) => {
        // Do not send prop in onHide event callback if it is an event
        if (prop && (prop as any).nativeEvent) {
            prop = undefined;
        }

        const { onHide } = this.props;
        if (onHide) {
            onHide(prop);
        }
        this.setState({ showDialog: false } as unknown as S);
    };

    protected getFooter?(): ReactNode;

    protected renderBase(children: ReactNode): ReactNode {
        const { showDialog } = this.state;
        const { title } = this;

        let footer: ReactNode = null;
        if (this.getFooter) {
            footer = this.getFooter();
        }

        return (
            <Modal isOpen={showDialog} onClose={this.onHide} title={title} style={this.style} className={this.className}>
                <div className="flex flex-col gap-4">
                    {children}
                    {footer && <div className="flex justify-end gap-2 pt-4 border-t border-(--border-color)">{footer}</div>}
                </div>
            </Modal>
        );
    }
}

export default BaseDialog;
