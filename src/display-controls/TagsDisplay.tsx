import { type ElementType } from 'react';

import { Link } from '@/controls';

import BaseControl from './BaseControl';

interface TagsDisplayProps {
    value?: any[] | any;
    tagProp?: string;
    titleProp?: string;
    iconClass?: string;
    hrefProp?: string;
    hideZero?: boolean;
    tag?: ElementType | null;
    className?: string;
    [key: string]: any;
}

const csvObjectTester = /^com\..*\[.*\].*$/;

function parseJiraCustomCSV(csv: string) {
    try {
        const match = csv.match(/\[(.*?)\]/);
        if (match) {
            const content = match[1];
            const pairs = content.split(',');
            const obj: any = {};
            pairs.forEach((pair) => {
                const [key, val] = pair.split('=');
                obj[key?.trim()] = val?.trim();
            });
            return obj;
        }
    } catch {}
    return { name: csv };
}

function TagsDisplay({ value, tagProp = 'name', titleProp, iconClass, hrefProp, hideZero, tag, className, ...rest }: TagsDisplayProps) {
    if (!value) return <BaseControl tag={tag} className={className} {...rest} />;

    const icon = !!iconClass && <span className={`fa ${iconClass}`} />;

    const renderTag = (a: any, i: number, isObject = false) => {
        let val = a;
        let item = a;

        if (typeof a === 'string') {
            if (csvObjectTester.test(a)) {
                item = parseJiraCustomCSV(a);
                val = item[tagProp] || val;
            }
        } else {
            val = a[tagProp];
            if (val === 0 && hideZero) return null;
        }

        const data = hrefProp ? (
            <Link href={a[hrefProp] || ''} className="text-blue-600 hover:underline inline-block px-2 py-1 bg-gray-200 rounded text-sm">
                {icon} {val}
            </Link>
        ) : (
            <span title={titleProp ? a[titleProp] : undefined} className="inline-block px-2 py-1 bg-gray-200 rounded text-sm">
                {icon} {val}
            </span>
        );

        if (isObject) return data;

        return (
            <li key={i} className="inline-block mr-2">
                {data}
            </li>
        );
    };

    if (Array.isArray(value)) {
        return (
            <BaseControl tag={tag} className={className} {...rest}>
                <ul className="list-none flex flex-wrap gap-2">{value.map((v, i) => renderTag(v, i))}</ul>
            </BaseControl>
        );
    } else if (typeof value === 'object') {
        return (
            <BaseControl tag={tag} className={className} {...rest}>
                {renderTag(value, 0, true)}
            </BaseControl>
        );
    }

    return <BaseControl tag={tag} className={className} {...rest} />;
}

export default TagsDisplay;
