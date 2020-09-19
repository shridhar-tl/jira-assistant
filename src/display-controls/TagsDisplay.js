import React from 'react';
import BaseControl from './BaseControl';

class TagsDisplay extends BaseControl {
    getRepeator(isObject) {
        const { tagProp = 'name', titleProp, iconClass, hrefProp } = this.props;
        const icon = !!iconClass && <span className={`fa ${iconClass}`} />;

        if (hrefProp) {
            return (a, i) => {
                const data = (
                    <a href={a[hrefProp] || undefined}
                        title={!!titleProp && a[titleProp]}
                        rel="noopener noreferrer" target="_blank"
                        className="link badge badge-pill skin-bg-font">
                        {icon} {(typeof a === 'string') ? a : a[tagProp]}
                    </a>
                );

                if (isObject) { return data; }

                return (<li key={i}>{data}</li>);
            };
        }

        return (a, i) => {
            const data = (
                <span title={!!titleProp && a[titleProp]}
                    className="badge badge-pill skin-bg-font">
                    {icon} {(typeof a === 'string') ? a : a[tagProp]}
                </span>
            );

            if (isObject) { return data; }

            return (<li key={i}>{data}</li>);
        };
    }

    renderControl() {
        const { value } = this.props;

        if (!value) { return null; }

        if (Array.isArray(value)) {
            return (<ul className="tags">{value.map(this.getRepeator())}</ul>);
        }
        else if (typeof value === 'object') {
            return this.getRepeator(true)(value, 0);
        }
    }
}

export default TagsDisplay;
