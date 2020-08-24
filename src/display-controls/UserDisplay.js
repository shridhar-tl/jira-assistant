import BaseControl from './BaseControl';

class UserDisplay extends BaseControl {
    renderControl() {
        const { value, user = value } = this.props;

        if (!user) { return null; }

        return (typeof user === 'string') ? user : user?.displayName;
    }
}

export default UserDisplay;