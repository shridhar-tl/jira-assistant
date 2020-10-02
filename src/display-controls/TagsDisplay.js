import React from 'react';
import BaseControl from './BaseControl';
import { parseJiraCustomCSV } from '../common/utils';

const CSV_OBJECT_TESTER = /^com\..*\[.*\].*$/;

class TagsDisplay extends BaseControl {
    getRepeator(isObject) {
        const { tagProp = 'name', titleProp, iconClass, hrefProp, hideZero } = this.props;
        const icon = !!iconClass && <span className={`fa ${iconClass}`} />;

        if (hrefProp) {
            return (a, i) => {
                const val = (typeof a === 'string') ? a : a[tagProp];
                if (val === 0 && hideZero) { return null; }

                const data = (
                    <a href={a[hrefProp] || undefined}
                        title={titleProp ? a[titleProp] : undefined}
                        rel="noopener noreferrer" target="_blank"
                        className="link badge badge-pill skin-bg-font">
                        {icon} {val}
                    </a>
                );

                if (isObject) { return data; }

                return (<li key={i}>{data}</li>);
            };
        }

        return (a, i) => {
            let val = a;
            if (typeof a === 'string') {
                if (CSV_OBJECT_TESTER.test(a)) {
                    a = parseJiraCustomCSV(a);
                    val = a[tagProp || 'name'] || val;
                }
            }
            else {
                val = a[tagProp];
                if (val === 0 && hideZero) { return null; }
            }

            const data = (
                <span title={titleProp ? a[titleProp] : undefined}
                    className="badge badge-pill skin-bg-font">
                    {icon} {val}
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
