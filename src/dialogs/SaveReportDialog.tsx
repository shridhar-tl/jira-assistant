import { ReactNode } from 'react';

import { Button, Checkbox, TextInput } from '@components';

import BaseDialog from './BaseDialog';

interface SaveReportDialogProps {
    queryName?: string;
    allowCopy?: boolean;
    onChange: (newQueryName: string, copyQuery: boolean) => void;
    onHide?: () => void;
}

interface SaveReportDialogState {
    showDialog: boolean;
    newQueryName: string;
    copyQuery: boolean;
}

class SaveReportDialog extends BaseDialog<SaveReportDialogProps, SaveReportDialogState> {
    constructor(props: SaveReportDialogProps) {
        super(props, 'Save Report As');
        this.style = { width: '350px' };
        this.state = {
            showDialog: true,
            newQueryName: props.queryName || '',
            copyQuery: false,
        };
    }

    nameChanged = (event: import('fluxo-ui').ComponentEvent<string>) => this.setState({ newQueryName: event.value });
    copyChanged = (event: import('fluxo-ui').ComponentEvent<boolean>) => this.setState({ copyQuery: event.value });

    done = () => {
        const { newQueryName, copyQuery } = this.state;
        this.props.onChange(newQueryName, copyQuery);
    };

    getFooter(): ReactNode {
        const { newQueryName } = this.state;

        return (
            <>
                <Button variant="secondary" onClick={this.onHide}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    leftIcon={<i className="fa fa-save" />}
                    disabled={!newQueryName || newQueryName.length < 3}
                    onClick={this.done}
                >
                    Save
                </Button>
            </>
        );
    }

    render() {
        const { allowCopy } = this.props;
        const { newQueryName, copyQuery } = this.state;

        return this.renderBase(
            <div className="p-4">
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Report Name</label>
                <div className="mb-3">
                    <TextInput value={newQueryName} onChange={this.nameChanged} className="w-full" placeholder="Enter report name" />
                </div>
                {allowCopy && (
                    <div>
                        <Checkbox checked={copyQuery} onChange={this.copyChanged} label="Save as new report" />
                    </div>
                )}
            </div>,
        );
    }
}

export default SaveReportDialog;
