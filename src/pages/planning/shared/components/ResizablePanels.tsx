import { useRef, type ReactNode } from 'react';

import classNames from 'classnames';

import { Splitter, SplitterPanel } from '@components';

import { savePanelSize } from '../../sprint-planner/actions';
import { usePlannerStore } from '../../sprint-planner/store';

interface ResizablePanelsProps {
    panelId: string;
    layout?: 'horizontal' | 'vertical';
    main: ReactNode;
    side?: ReactNode;
    sideFirst?: boolean;
    defaultSideSize: number;
    minSideSize?: number;
    minMainSize?: number;
    className?: string;
}

const gutterSize = 6;
const stackBelowWidth = 768;

export default function ResizablePanels({
    panelId,
    layout = 'horizontal',
    main,
    side,
    sideFirst,
    defaultSideSize,
    minSideSize = 120,
    minMainSize = 240,
    className,
}: ResizablePanelsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const storedSize = usePlannerStore((s) => s.settings.panelSizes[panelId]);
    const isHorizontal = layout === 'horizontal';

    const handleResizeEnd = (firstSize: number) => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        const total = isHorizontal ? container.clientWidth : container.clientHeight;
        savePanelSize(panelId, Math.max(minSideSize, sideFirst ? firstSize : total - firstSize - gutterSize));
    };

    const mainPanel = (
        <SplitterPanel minSize={`${minMainSize}px`} className="flex min-h-0 min-w-0 flex-col">
            {main}
        </SplitterPanel>
    );
    const sidePanel = side ? (
        <SplitterPanel minSize={`${minSideSize}px`} defaultSize={`${storedSize || defaultSideSize}px`} className="flex min-h-0 min-w-0 flex-col">
            {side}
        </SplitterPanel>
    ) : null;

    return (
        <div ref={containerRef} className={classNames('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
            <Splitter layout={layout} className="min-h-0 flex-1" gutterSize={gutterSize} onResizeEnd={handleResizeEnd} responsive={isHorizontal ? stackBelowWidth : undefined}>
                {sideFirst ? sidePanel : mainPanel}
                {sideFirst ? mainPanel : sidePanel}
            </Splitter>
        </div>
    );
}
