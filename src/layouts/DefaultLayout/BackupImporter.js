import React, { PureComponent } from 'react';
import { parseCustomJSON } from '../../common/storage-helpers';
import { inject } from '../../services/injector-service';

class BackupImporter extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'BackupService', 'MessageService');
        this.state = {};
    }

    setFileSelector = (f) => this.fileSelector = f;
    chooseFileForImport = (e) => this.fileSelector.click();

    fileSelected = () => {
        const selector = this.fileSelector;
        const file = selector.files[0];

        if (file) {
            if (!file.name.endsWith('.jab')) {
                this.$message.warning("Unknown file selected to import. Select a valid Jira Assist Backup (*.jab) file");
                selector.value = '';
                return;
            }

            const reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = async (evt) => {
                const json = evt.target.result;
                try {
                    const data = parseCustomJSON(json);
                    await this.$backup.importData(data?.value);
                    this.$message.success('Settings imported successfully');
                }
                catch (err) {
                    this.$message.error("Selected file is invalid or is corrupted");
                }
            };
            reader.onerror = (evt) => {
                this.$message.error("Selected file is invalid or is corrupted. Unable to load the file!");
            };
        } else {
            this.$message.warning('Import operation cancelled');
        }
        selector.value = '';
    };

    render() {
        return (<>
            {this.props.children(this.chooseFileForImport)}
            <input ref={this.setFileSelector} type="file" className="hide" accept=".jab" onChange={this.fileSelected} />
        </>);
    }
}

export default BackupImporter;