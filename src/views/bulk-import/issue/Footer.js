import React, { PureComponent } from 'react';
import { Button } from '../../../controls';

class Footer extends PureComponent {
    render() {
        const { isLoading, selectedCount, clearImportData, importIssues } = this.props;

        const importLabel = `Import ${selectedCount || ''} Issues`;

        return <div className="pnl-footer">
            <div className="float-end">
                <Button text type="info" icon="fa fa-list" label="Clear" disabled={isLoading} onClick={clearImportData} />
                <Button type="success" icon="fa fa-upload" disabled={isLoading || !(selectedCount > 0)}
                    label={importLabel} onClick={importIssues} />
            </div>
        </div>;
    }
}

export default Footer;