import { PureComponent } from 'react';

class ChangeTracker extends PureComponent {
    componentDidMount() {
        if (this.props.enabled) {
            this.props.onChange();
        }
    }

    render() { return null; }
}

export default ChangeTracker;