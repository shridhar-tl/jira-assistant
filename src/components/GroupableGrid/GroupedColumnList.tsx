import { Sortable } from '../../controls';
import { showContextMenu } from '@components';

import type { ColumnSchema, GroupedColumnListProps, GroupedColumnSchema, GroupOption, GroupSettings } from './types';

const emptyGroupPlaceholder = <span className="empty-group-msg">Drag and drop column here to group data</span>;
const addGroupItemPlaceholder = <span>Drag and drop more columns here</span>;

export default function GroupedColumnList({
    groupBy,
    allColumns,
    displayColumns,
    foldable,
    showColumns,
    onChange,
    toggleColumns,
}: GroupedColumnListProps) {
    const toggleSort = (i: number, desc: boolean) => {
        const newGroupBy = [...groupBy];
        newGroupBy[i] = { ...newGroupBy[i], sortDesc: desc };
        onChange(newGroupBy, !!foldable, 'sort');
    };

    const changeSettings = (i: number, settings: GroupSettings) => {
        const newGroupBy = [...groupBy];
        newGroupBy[i] = { ...newGroupBy[i], settings };
        onChange(newGroupBy, !!foldable, 'settings');
    };

    const removeGroup = (i: number) => {
        const newGroupBy = [...groupBy];
        newGroupBy.splice(i, 1);
        onChange(newGroupBy, !!foldable, 'remove');
    };

    const toggleMode = (newValue: boolean) => {
        if (!!foldable === newValue) {
            return;
        }
        onChange(groupBy, newValue, 'mode');
    };

    const columnReordered = (newGroupBy: GroupedColumnSchema[]) => {
        const normalized = newGroupBy.map((g) =>
            g.sortDesc !== undefined
                ? g
                : {
                      id: g.id,
                      field: g.field,
                      fieldKey: (g as ColumnSchema).fieldKey || g.field,
                      displayText: g.displayText,
                      visible: true,
                      allowSorting: g.allowSorting,
                      groupOptions: g.groupOptions,
                      type: g.type,
                      viewComponent: g.viewComponent,
                      sortDesc: false,
                  },
        );
        const type = normalized.length > groupBy.length ? 'add' : 'rearrange';
        onChange(normalized, !!foldable, type);
    };

    let badgeText: string | number | null = null;
    if (displayColumns && displayColumns.length < allColumns?.length) {
        badgeText = `${displayColumns.length} (${allColumns.length})`;
    } else if (allColumns?.length) {
        badgeText = allColumns.length;
    }

    return (
        <div className="group-bar">
            <span
                className={`fa group-mode-icon fa-columns${showColumns ? ' active' : ''}`}
                onClick={toggleColumns}
                title="Click to choose what column to display"
            >
                {badgeText && <span className="badge bg-warning text-dark visible-cols">{badgeText}</span>}
            </span>
            {groupBy.length > 0 && (
                <span
                    className={`fa group-mode-icon fa-th-list${foldable ? '' : ' active'}`}
                    onClick={() => toggleMode(false)}
                    title="Display group values in columns"
                />
            )}
            {groupBy.length > 0 && (
                <span
                    className={`fa group-mode-icon fa-indent${foldable ? ' active' : ''}`}
                    onClick={() => toggleMode(true)}
                    title="Display group values in foldable row"
                />
            )}

            <span className="group-label">Group by:</span>
            <div className="group-list-container">
                <Sortable
                    provideDropRef
                    className="group-list"
                    items={groupBy}
                    itemType="column"
                    accept="column"
                    orientation="horizontal"
                    onChange={columnReordered}
                    placeholder={groupBy.length ? addGroupItemPlaceholder : emptyGroupPlaceholder}
                >
                    {(g: GroupedColumnSchema, i: number, { droppable }: any) => (
                        <GroupedColumn
                            key={i}
                            group={g}
                            index={i}
                            toggleSort={toggleSort}
                            removeGroup={removeGroup}
                            settingsChanged={changeSettings}
                            dropProps={droppable}
                        />
                    )}
                </Sortable>
            </div>
        </div>
    );
}

interface GroupedColumnProps {
    group: GroupedColumnSchema;
    index: number;
    toggleSort: (i: number, desc: boolean) => void;
    removeGroup: (i: number) => void;
    settingsChanged: (i: number, settings: GroupSettings) => void;
    dropProps?: { dropRef?: (el: HTMLElement | null) => void };
}

function GroupedColumn({ group, index, toggleSort, removeGroup, settingsChanged, dropProps }: GroupedColumnProps) {
    const setRef = (el: HTMLElement | null) => {
        if (dropProps?.dropRef) {
            dropProps.dropRef(el);
        }
    };

    const changeSettings = (menuItem: GroupOption) => {
        const { prop, type, value, default: def } = menuItem;
        let settings: GroupSettings = group.settings ? { ...group.settings } : {};
        if (type === 'check') {
            const curValue = settings[prop] === undefined ? def : settings[prop];
            settings[prop] = !curValue;
        } else {
            settings[prop] = value;
        }
        settingsChanged(index, settings);
    };

    const showMenu = (e: React.MouseEvent) => {
        const { groupOptions, settings } = group;
        if (!groupOptions?.length) return;

        const menuItems = groupOptions.map((m) => {
            if (m.separator) {
                return { separator: true, label: '' };
            }
            const { label, type, prop, value = type === 'check', default: def } = m;
            const curValue = settings?.[prop];
            const selected = curValue === value || (curValue === undefined && def);
            const prefix = `fa fa-${selected ? 'check-' : ''}`;
            const icon = `${prefix}${type === 'check' ? 'square' : 'circle'}`;

            return { label, icon, command: () => changeSettings(m) };
        });

        showContextMenu(e, menuItems);
    };

    return (
        <div ref={setRef} className="group-list-item" onContextMenu={group.groupOptions?.length ? showMenu : undefined}>
            {!group.sortDesc && (
                <span className="fa fa-sort-amount-desc sort-icon" onClick={() => toggleSort(index, true)} title="Click to sort desc" />
            )}
            {!!group.sortDesc && (
                <span className="fa fa-sort-amount-asc sort-icon" onClick={() => toggleSort(index, false)} title="Click to sort asc" />
            )}
            {group.displayText}
            {!!group.groupOptions?.length && (
                <span className="fa fa-wrench margin-l-5 pointer" onClick={showMenu} title="Click to change settings" />
            )}
            <span className="fa fa-times" onClick={() => removeGroup(index)} />
        </div>
    );
}
