import React, { PureComponent } from 'react';

class BaseControl extends PureComponent {
    render() {
        const { tag: Tag = "td", className } = this.props;

        return (
            <Tag className={className}>{this.renderControl()}</Tag>
        );
    }
}

export default BaseControl;