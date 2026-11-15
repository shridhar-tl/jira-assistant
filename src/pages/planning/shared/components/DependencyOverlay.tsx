import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export interface OverlayLink {
    id: string;
    from: string;
    to: string;
    conflict: boolean;
    title: string;
}

interface DependencyOverlayProps {
    container: HTMLElement | null;
    links: OverlayLink[];
    attribute: string;
    visible: boolean;
}

interface DrawnPath {
    id: string;
    d: string;
    conflict: boolean;
    title: string;
}

function findElement(container: HTMLElement, attribute: string, value: string): HTMLElement | null {
    return container.querySelector<HTMLElement>(`[${attribute}="${CSS.escape(value)}"]`);
}

/**
 * Draws a curved line from the blocker card to the dependant card for every link whose cards are rendered in the container.
 * Positions are re-measured when the container scrolls or resizes.
 */
export default function DependencyOverlay({ container, links, attribute, visible }: DependencyOverlayProps) {
    const [paths, setPaths] = useState<DrawnPath[]>([]);
    const [size, setSize] = useState({ width: 0, height: 0 });

    const measure = useCallback(() => {
        if (!container || !visible) {
            setPaths([]);
            return;
        }
        const base = container.getBoundingClientRect();
        const offsetX = container.scrollLeft - base.left;
        const offsetY = container.scrollTop - base.top;
        const drawn: DrawnPath[] = [];

        for (const link of links) {
            const from = findElement(container, attribute, link.from);
            const to = findElement(container, attribute, link.to);
            if (!from || !to) {
                continue;
            }
            const a = from.getBoundingClientRect();
            const b = to.getBoundingClientRect();
            const startX = a.right + offsetX;
            const startY = a.top + a.height / 2 + offsetY;
            const endX = b.left + offsetX;
            const endY = b.top + b.height / 2 + offsetY;
            const bend = Math.max(30, Math.abs(endX - startX) / 2);
            drawn.push({
                id: link.id,
                d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
                conflict: link.conflict,
                title: link.title,
            });
        }

        setSize({ width: container.scrollWidth, height: container.scrollHeight });
        setPaths(drawn);
    }, [container, links, attribute, visible]);

    useLayoutEffect(() => {
        measure();
    }, [measure]);

    useEffect(() => {
        if (!container || !visible) {
            return;
        }
        let frame = 0;
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(container);
        container.addEventListener('scroll', schedule, true);
        window.addEventListener('resize', schedule);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            container.removeEventListener('scroll', schedule, true);
            window.removeEventListener('resize', schedule);
        };
    }, [container, visible, measure]);

    if (!visible || !paths.length) {
        return null;
    }

    return (
        <svg className="pointer-events-none absolute left-0 top-0 z-10" width={size.width} height={size.height} aria-hidden="true">
            <defs>
                <marker id="ja-dep-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker id="ja-dep-arrow-conflict" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
            </defs>
            {paths.map((p) => (
                <path
                    key={p.id}
                    d={p.d}
                    fill="none"
                    stroke={p.conflict ? '#ef4444' : '#64748b'}
                    strokeWidth={p.conflict ? 2 : 1.5}
                    strokeDasharray={p.conflict ? undefined : '4 3'}
                    markerEnd={p.conflict ? 'url(#ja-dep-arrow-conflict)' : 'url(#ja-dep-arrow)'}
                >
                    <title>{p.title}</title>
                </path>
            ))}
        </svg>
    );
}
