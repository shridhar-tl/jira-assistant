import React, { PureComponent } from 'react';

class UserDisplay extends PureComponent {
    render() {
        const { tag: Tag = "span", className, user } = this.props;
        if (!user) { return null; }

        return (
            <Tag className={className}>{user.displayName} </Tag>
        );
    }
}

export default UserDisplay;