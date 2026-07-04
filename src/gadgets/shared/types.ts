import { GadgetActionTypeValue } from '@constants';

import { ExportFormat } from '../../common/Exporter';

export interface GadgetAction {
    type: GadgetActionTypeValue;
    data?: any;
}

export interface GadgetModel {
    name: string;
    settings?: Record<string, any>;
}

export interface BaseGadgetProps {
    isGadget?: boolean;
    tabLayout?: boolean;
    tabHeaderSlot?: HTMLElement | null;
    index?: number;
    model?: GadgetModel;
    settings?: Record<string, any>;
    layout?: string;
    onAction?: (action: GadgetAction, model?: GadgetModel, index?: number) => void;
    draggableHandle?: ((node: HTMLDivElement | null) => void) | null;
    dropProps?: { dropRef: ((node: HTMLDivElement | null) => void) | null };
    gadgetType?: string;
}

export interface BaseGadgetConfig {
    title: string;
    hideRefresh?: boolean;
    hideMenu?: boolean;
    hideExport?: boolean;
    hideCSVExport?: boolean;
    hideXLSXExport?: boolean;
    hidePDFExport?: boolean;
    exportFormat?: typeof ExportFormat;
    className?: string;
}
