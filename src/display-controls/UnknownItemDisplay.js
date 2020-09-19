import BaseControl from './BaseControl';

class UnknownItemDisplay extends BaseControl {
    renderControl() {
        const { value } = this.props;

        if (!value) { return null; }

        if (typeof value === 'string') {
            return value;
        } else {
            return JSON.stringify(value);
        }
    }
}

export default UnknownItemDisplay;