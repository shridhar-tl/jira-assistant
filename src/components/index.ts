import { createElement } from 'react';

import { showContextMenu as _showContextMenu } from 'fluxo-ui';

export {
    Autocomplete,
    AutocompleteMulti,
    Button,
    Checkbox,
    Chips,
    DateRangePicker,
    Dropdown,
    FieldLabel,
    hideSnackbar,
    hideTooltip,
    InputGroup,
    InputSwitch,
    ListBox,
    MaskedInput,
    Modal,
    Multiselect,
    MultiStateCheckbox,
    NumericInput,
    Password,
    Popover,
    RadioButton,
    RadioButtonGroup,
    SelectButton,
    ShimmerBarChart,
    ShimmerDiv,
    ShimmerTable,
    showSnackbar,
    showTooltip,
    SnackbarManager,
    Splitter,
    SplitterPanel,
    Table,
    TabPage,
    TabView,
    TextArea,
    TextInput,
    ToggleButton,
    type ComponentEvent,
    type ListItem as ContextMenuItem,
    type DateSelectedCallbackArg,
    type MaskedInputProps,
    type SplitterLayout,
    type SplitterPanelProps,
    type SplitterProps,
} from 'fluxo-ui';

export interface ContextMenuItemInput {
    label?: string;
    icon?: string | React.ReactNode;
    command?: (id?: any) => void;
    disabled?: boolean;
    separator?: boolean;
    seperator?: boolean;
    items?: ContextMenuItemInput[];
    [key: string]: any;
}

function transformMenuItems(items: ContextMenuItemInput[]): any[] {
    return items.map((item) => {
        const transformed: any = { ...item };

        if (typeof item.icon === 'string') {
            transformed.icon = createElement('span', { className: item.icon });
        }

        if (item.separator && !item.seperator) {
            transformed.seperator = true;
        }

        if (item.items) {
            transformed.items = transformMenuItems(item.items);
        }

        return transformed;
    });
}

export function showContextMenu(event: React.MouseEvent, menus: ContextMenuItemInput[], options?: any) {
    _showContextMenu(event, transformMenuItems(menus), options);
}

export { default as ChangeTracker } from './ChangeTracker';
export { EditableGrid } from './editable-table';
export type { EditableGridProps, GridCellProps, GridColumn } from './editable-table';
export { default as ErrorBoundary } from './ErrorBoundary';
export { BlockLoading, Loading } from './Loading';
export { LoadingSpinner } from './LoadingSpinner';
export * from './shared';
export { default as TextParser } from './TextParser';
export { default as WorklogIndicator } from './worklog-indicator';
