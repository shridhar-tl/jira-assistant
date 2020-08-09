import React from 'react';
import BaseControl from './BaseControl';

class UserDisplay extends BaseControl {
    renderControl() {
        const { className, value, user = value } = this.props;

        if (!user) { return null; }

        return (
            <span className={className}>{user.displayName} </span>
        );
    }
}

export default UserDisplay;