import { PureComponent } from 'react';
import { inject } from '../../../services';

class TabControlBase extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "SettingsService", "SessionService");
    }

    saveSetting = (value, field) => this.props.onSave(value, field);

    saveIntSetting = (value, field) => {
        value = parseInt(value);
        if (isNaN(value)) {
            // ToDo: Show some error message
            return;
        }
        this.saveSetting(value, field);
    };
}

export default TabControlBase;