import { createElement } from 'react';

import { showContextMenu as _showContextMenu } from 'fluxo-ui';

export {
    Alert,
    Autocomplete,
    AutocompleteMulti,
    Avatar,
    AvatarGroup,
    Badge,
    Button,
    Calendar,
    CalendarNavigation,
    Checkbox,
    Chips,
    ColorPicker,
    Confirm,
    ConfirmPopoverManager,
    DateRangePicker,
    Drawer,
    Dropdown,
    EmptyState,
    FieldLabel,
    GanttChart,
    hideSnackbar,
    hideTooltip,
    InputGroup,
    InputSwitch,
    KanbanBoard,
    ListBox,
    MaskedInput,
    MenuNav,
    Modal,
    Multiselect,
    MultiStateCheckbox,
    NumericInput,
    OverlayPanel,
    Password,
    Popover,
    ProgressBar,
    RadioButton,
    RadioButtonGroup,
    ResourceTimeline,
    SelectButton,
    ShimmerBarChart,
    ShimmerDiv,
    ShimmerTable,
    showSnackbar,
    showTooltip,
    SnackbarManager,
    Sortable,
    Splitter,
    SplitterPanel,
    Table,
    TabPage,
    TabView,
    TextArea,
    TextInput,
    TimePicker,
    ToggleButton,
    TooltipManager,
    ViewMode as CalendarViewMode,
    type CalendarEntry,
    type DragInfo as CalendarDragInfo,
    type EntryRenderer as CalendarEntryRenderer,
    type ResolvedCalendarEntry,
    type SelectionInfo as CalendarSelectionInfo,
    type ComponentEvent,
    type ListItem as ContextMenuItem,
    type DateRangeValue,
    type DateSelectedCallbackArg,
    type TimePickerValue,
    type GanttColumn,
    type GanttDependencyClickEvent,
    type GanttDependencyCreateEvent,
    type GanttBand,
    type GanttMarker,
    type GanttSegment,
    type GanttSegmentChangeEvent,
    type GanttSegmentClickEvent,
    type GanttTask,
    type GanttTaskChangeEvent,
    type GanttTaskClickEvent,
    type GanttTaskCreateEvent,
    type GanttViewMode,
    type EntryRenderContext,
    type ColorPickerProps,
    type KanbanCardData,
    type KanbanCardMoveEvent,
    type KanbanCardReorderEvent,
    type KanbanColumnData,
    type KanbanColumnHeaderHelpers,
    type ResourceTimelineDropEvent,
    type ResourceTimelineEvent,
    type ResourceTimelineEventChangeEvent,
    type ResourceTimelineEventClickEvent,
    type ResourceTimelineResource,
    type TaskBarTemplateProps,
    type MaskedInputProps,
    type MenuNavItem,
    type SplitterLayout,
    type SplitterPanelProps,
    type SplitterProps,
} from 'fluxo-ui';

export { useEscapeLayer } from 'fluxo-ui/hooks';

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
