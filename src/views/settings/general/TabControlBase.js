import { PureComponent } from 'react';
import { inject } from '../../../services';

class TabControlBase extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "SettingsService", "SessionService");
    }

    saveSetting = (value, field) => {
        let { settings } = this.props;
        settings = { ...settings };
        settings[field] = value;

        this.setState({ settings });

        this.$settings.saveGeneralSetting(this.props.userId, field, value);

        const cUser = this.$session.CurrentUser;
        cUser[field] = value;
    };

    saveIntSetting = (value, field) => {
        value = parseInt(value);
        if (isNaN(value)) {
            // ToDo: Show some error message
            return;
        }
        this.saveSetting(value, field);
    };

    setValue = (field, value) => {
        let { settings } = this.props;
        if (value) {
            settings[field] = value;
        }
        else {
            delete settings[field];
        }

        settings = { ...settings };
        this.setState({ settings });
    };
}

export default TabControlBase;