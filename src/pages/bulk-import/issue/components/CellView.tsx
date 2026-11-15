import classNames from 'classnames';

import { Image, Link } from '@/controls';

import type { DisplayItem, ImportCell } from '../types';

interface CellViewProps {
    cell?: ImportCell;
    existing?: DisplayItem[];
    getTicketUrl: (key: string) => string | undefined;
}

interface ItemListProps {
    items: DisplayItem[];
    getTicketUrl: (key: string) => string | undefined;
    muted?: boolean;
    struck?: boolean;
}

function ItemList({ items, getTicketUrl, muted, struck }: ItemListProps) {
    const isMultiple = items.length > 1;

    return (
        <span
            className={classNames('inline-flex items-center gap-1 min-w-0', {
                'text-(--text-tertiary) italic': muted,
                'line-through': struck,
            })}
        >
            {items.map((item, index) => {
                const url = item.issueKey ? getTicketUrl(item.issueKey) : undefined;
                const content = (
                    <>
                        {!!item.avatarUrl && <Image src={item.avatarUrl} alt="" className="w-4 h-4 shrink-0 rounded-sm" />}
                        <span className="truncate">{item.text}</span>
                    </>
                );

                return (
                    <span
                        key={index}
                        className={classNames('inline-flex items-center gap-1 min-w-0', {
                            'px-1.5 rounded bg-(--bg-tertiary) text-xs': isMultiple,
                        })}
                    >
                        {url ? (
                            <Link
                                href={url}
                                className="inline-flex items-center gap-1 text-(--color-primary-600) hover:underline cursor-pointer"
                            >
                                {content}
                            </Link>
                        ) : (
                            content
                        )}
                    </span>
                );
            })}
        </span>
    );
}

function CellView({ cell, existing, getTicketUrl }: CellViewProps) {
    const hasExisting = !!existing?.length;
    let content: React.ReactNode = null;

    if (cell?.clear) {
        content = (
            <span className="inline-flex items-center gap-1.5 min-w-0">
                <span className="px-1.5 rounded text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">clear</span>
                {hasExisting && <ItemList items={existing!} getTicketUrl={getTicketUrl} muted struck />}
            </span>
        );
    } else if (cell?.display?.length) {
        content = <ItemList items={cell.display} getTicketUrl={getTicketUrl} muted={cell.unchanged} />;
    } else if (cell?.input) {
        content = <span className="truncate">{cell.input}</span>;
    } else if (hasExisting) {
        content = <ItemList items={existing!} getTicketUrl={getTicketUrl} muted />;
    }

    return (
        <span className="flex items-center gap-1 min-w-0" title={cell?.error || cell?.warning || undefined}>
            <span className="flex-1 min-w-0 overflow-hidden">{content}</span>
            {!!cell?.error && <i className="fa fa-exclamation-circle text-red-500 shrink-0" />}
            {!cell?.error && !!cell?.warning && <i className="fa fa-exclamation-triangle text-amber-500 shrink-0" />}
        </span>
    );
}

export default CellView;
