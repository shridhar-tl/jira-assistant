import React, { PureComponent } from 'react';

class BaseControl extends PureComponent {
    render() {
        const { tag: Tag = "td", className, settings, count } = this.props;

        const badge = !!count && !!settings?.showGroupCount && (
            <span className="badge badge-info margin-l-5"
                title={`Total issues in group: ${count}`}>({count})</span>);

        return (
            <Tag className={className}>{this.renderControl(badge)}</Tag>
        );
    }
}

export default BaseControl;