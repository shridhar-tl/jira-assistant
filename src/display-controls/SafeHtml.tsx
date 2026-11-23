import { createElement, Fragment, useMemo, type ReactNode } from 'react';

import { toSafeUrl } from '@utils/safe-url';

interface SafeHtmlProps {
    html: string;
    maxLength?: number;
    className?: string;
}

interface RenderState {
    remaining: number;
    truncated: boolean;
}

const allowedTags: ReadonlySet<string> = new Set(['b', 'strong', 'i', 'em', 'u', 's', 'br', 'p', 'div', 'span', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote']);
const droppedTags: ReadonlySet<string> = new Set(['script', 'style', 'template', 'noscript', 'iframe', 'object', 'embed', 'svg', 'math', 'head', 'title']);
const linkProtocols: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:']);
const ellipsis = '...';

function renderText(text: string, state: RenderState): string {
    if (state.remaining === Infinity) return text;
    if (text.length <= state.remaining) {
        state.remaining -= text.length;
        return text;
    }
    const visible = text.substring(0, state.remaining);
    state.remaining = 0;
    state.truncated = true;
    return visible + ellipsis;
}

function renderChildren(parent: Node, state: RenderState): ReactNode[] {
    const result: ReactNode[] = [];
    for (const child of Array.from(parent.childNodes)) {
        if (state.truncated) break;
        const rendered = renderNode(child, state, result.length);
        if (rendered !== null) result.push(rendered);
    }
    return result;
}

function renderNode(node: Node, state: RenderState, key: number): ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
        return renderText(node.textContent || '', state);
    }

    if (!(node instanceof Element)) return null;

    const tag = node.tagName.toLowerCase();
    if (droppedTags.has(tag)) return null;

    if (tag === 'br') return createElement('br', { key });

    const children = renderChildren(node, state);

    if (tag === 'a') {
        const href = toSafeUrl(node.getAttribute('href') || '', linkProtocols);
        if (!href) return createElement(Fragment, { key }, ...children);
        return createElement('a', { key, href, target: '_blank', rel: 'noopener noreferrer', className: 'cursor-pointer' }, ...children);
    }

    if (allowedTags.has(tag)) return createElement(tag, { key }, ...children);

    return createElement(Fragment, { key }, ...children);
}

function toReactNodes(html: string, maxLength?: number): ReactNode[] {
    const body = new DOMParser().parseFromString(html, 'text/html').body;
    return renderChildren(body, { remaining: maxLength ?? Infinity, truncated: false });
}

export default function SafeHtml({ html, maxLength, className }: SafeHtmlProps) {
    const content = useMemo(() => toReactNodes(html, maxLength), [html, maxLength]);
    return <div className={className}>{content}</div>;
}
