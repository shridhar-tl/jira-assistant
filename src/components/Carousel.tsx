import { useState, useCallback, type ReactNode } from 'react';

import classNames from 'classnames';

interface CarouselProps<T> {
    value: T[];
    itemTemplate: (item: T, index: number) => ReactNode;
    header?: ReactNode;
    numVisible?: number;
    numScroll?: number;
    circular?: boolean;
    className?: string;
    contentClassName?: string;
}

export default function Carousel<T>({
    value,
    itemTemplate,
    header,
    numVisible = 1,
    numScroll = 1,
    circular = false,
    className,
    contentClassName,
}: CarouselProps<T>) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const totalItems = value.length;
    const maxIndex = Math.max(0, totalItems - numVisible);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => {
            const next = prev + numScroll;
            if (next > maxIndex) {
                return circular ? 0 : maxIndex;
            }
            return next;
        });
    }, [numScroll, maxIndex, circular]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => {
            const next = prev - numScroll;
            if (next < 0) {
                return circular ? maxIndex : 0;
            }
            return next;
        });
    }, [numScroll, maxIndex, circular]);

    const hasPrev = circular || currentIndex > 0;
    const hasNext = circular || currentIndex < maxIndex;
    const visibleItems = value.slice(currentIndex, currentIndex + numVisible);

    const indicators = Array.from({ length: Math.ceil(totalItems / numScroll) }, (_, i) => i);
    const activeIndicator = Math.floor(currentIndex / numScroll);

    return (
        <div className={classNames('relative', className)}>
            {header && <div className="mb-2">{header}</div>}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className={classNames(
                        'shrink-0 w-8 h-8 flex items-center justify-center rounded-full',
                        'border border-(--border-color) bg-(--bg-secondary) text-primary',
                        'hover:bg-(--bg-primary) transition-colors',
                        { 'opacity-30 cursor-not-allowed': !hasPrev },
                    )}
                    onClick={goPrev}
                    disabled={!hasPrev}
                    aria-label="Previous"
                >
                    <i className="fa fa-chevron-left text-xs" />
                </button>

                <div className={classNames('flex-1 overflow-hidden', contentClassName)}>
                    <div className="flex transition-transform duration-300" style={{ gap: '1rem' }}>
                        {visibleItems.map((item, i) => (
                            <div
                                key={currentIndex + i}
                                className="shrink-0"
                                style={{ width: `calc(${100 / numVisible}% - ${((numVisible - 1) * 16) / numVisible}px)` }}
                            >
                                {itemTemplate(item, currentIndex + i)}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    className={classNames(
                        'shrink-0 w-8 h-8 flex items-center justify-center rounded-full',
                        'border border-(--border-color) bg-(--bg-secondary) text-primary',
                        'hover:bg-(--bg-primary) transition-colors',
                        { 'opacity-30 cursor-not-allowed': !hasNext },
                    )}
                    onClick={goNext}
                    disabled={!hasNext}
                    aria-label="Next"
                >
                    <i className="fa fa-chevron-right text-xs" />
                </button>
            </div>

            {totalItems > numVisible && (
                <div className="flex justify-center gap-1.5 mt-3">
                    {indicators.map((i) => (
                        <button
                            key={i}
                            type="button"
                            className={classNames(
                                'w-2 h-2 rounded-full transition-colors',
                                i === activeIndicator ? 'bg-(--text-primary)' : 'bg-(--border-color) hover:bg-(--text-secondary)',
                            )}
                            onClick={() => setCurrentIndex(Math.min(i * numScroll, maxIndex))}
                            aria-label={`Go to page ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
