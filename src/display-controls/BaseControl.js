import React, { PureComponent } from 'react';

class BaseControl extends PureComponent {
    render() {
        const { tag: Tag = "td", tagProps, className, settings, count } = this.props;

        const badge = !!count && !!settings?.showGroupCount && (
            <span className="badge bg-info margin-l-5"
                title={`Total issues in group: ${count}`}>({count})</span>);

        if (Tag === null) {
            return this.renderControl(badge);
        }

        return (
            <Tag className={className} {...tagProps}>{this.renderControl(badge)}</Tag>
        );
    }
}

export default BaseControl;