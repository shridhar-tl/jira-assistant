import { useRef } from 'react';

import type { BaseGadgetProps } from './types';

export function BaseGadgetUnavailable({ gadgetType, dropProps }: BaseGadgetProps) {
    const elementRef = useRef<HTMLDivElement>(null);

    const setRef = (el: HTMLDivElement | null) => {
        elementRef.current = el;
        if (dropProps?.dropRef) {
            dropProps.dropRef(el);
        }
    };

    return (
        <div ref={setRef} className="gadget half-width half-height" data-test-id={gadgetType}>
            <div className="p-panel">
                <div className="p-panel-header">
                    <div className="flex items-center px-3 py-2 font-semibold text-sm">Gadget Unavailable</div>
                </div>
                <div className="p-panel-content">
                    <div className="p-5 text-center text-secondary">
                        This section contains an unknown gadget. Please report about this issue to have it fixed!
                    </div>
                </div>
            </div>
        </div>
    );
}
