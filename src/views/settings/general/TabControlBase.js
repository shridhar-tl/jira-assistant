import { PureComponent } from 'react';

class TabControlBase extends PureComponent {
    setValue = (field, value) => {
        let { settings } = this.props;
        if (value) {
            settings[field] = value;
        }
        else {
            delete settings[field];
        }

        this.props.onChange(settings);

        settings = { ...settings };
        this.setState({ settings });
    }
}

export default TabControlBase;