import { useEffect, useRef, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Sortable } from 'fluxo-ui';

import { GadgetActionType } from '@/constants';

import { inject } from '@services';

import { TabPage, TabView } from '@components';

import type { Dashboard as DashboardType, Widget } from '@types';

import AddWorklog from '@dialogs/AddWorklog';

import { dashboardEventEmitter } from '../../gadgets/BaseGadget';

import { AddGadget } from './components/AddGadget';
import { DashboardHeader } from './components/DashboardHeader';
import './Dashboard.css';
import { getGadgetComponent } from './gadget-registry';

interface GadgetAction {
    type: number;
    data?: any;
}

function loadBoardAtIndex(dashboards: DashboardType[], index: number) {
    const actualIndex = index >= dashboards.length ? 0 : index;
    return dashboards[actualIndex] ?? null;
}

export default function Dashboard() {
    const { index: indexParam } = useParams();
    const dashboardIndex = parseInt(indexParam || '0');

    const { $dashboard, $session } = inject('DashboardService', 'SessionService');

    const dashboardIndexRef = useRef(dashboardIndex);

    const dashboards: DashboardType[] = $session.CurrentUser?.dashboards || [];
    const quickView = $session.isQuickView || false;
    const initialBoard = loadBoardAtIndex(dashboards, dashboardIndex);

    const [currentBoard, setCurrentBoard] = useState<DashboardType | null>(initialBoard);
    const currentBoardRef = useRef<DashboardType | null>(initialBoard);
    const [isTabView, setIsTabView] = useState(quickView || initialBoard?.isTabView || false);

    useEffect(() => {
        dashboardIndexRef.current = dashboardIndex;
        const board = loadBoardAtIndex(dashboards, dashboardIndex);
        currentBoardRef.current = board;
        setCurrentBoard(board);
        setIsTabView(quickView || board?.isTabView || false);
    }, [dashboardIndex]); // eslint-disable-line react-hooks/exhaustive-deps
    const [showGadgetPanel, setShowGadgetPanel] = useState(false);
    const [showWorklogPopup, setShowWorklogPopup] = useState(false);
    const [worklogItem, setWorklogItem] = useState<any>(null);
    const [tabHeaderSlot, setTabHeaderSlot] = useState<HTMLElement | null>(null);

    const updateCurrentBoard = (board: DashboardType) => {
        currentBoardRef.current = board;
        setCurrentBoard(board);
    };

    const saveDashboardInfo = (board?: DashboardType) => {
        const boardToSave = board ?? currentBoardRef.current;
        if (!boardToSave) return;
        $dashboard.saveDashboardInfo(dashboardIndexRef.current, boardToSave);
    };

    const addGadget = (gadgetName: string, settings?: any) => {
        if (!currentBoardRef.current) return;
        const updatedBoard = { ...currentBoardRef.current };
        updatedBoard.widgets = [...(updatedBoard.widgets || []), { name: gadgetName, settings: settings || {} }];
        updateCurrentBoard(updatedBoard);
    };

    const removeGadget = (gadgetName: string) => {
        if (!currentBoardRef.current) return;
        const updatedBoard = { ...currentBoardRef.current };
        updatedBoard.widgets = (updatedBoard.widgets || []).filter((g: any) => g.name !== gadgetName);
        updateCurrentBoard(updatedBoard);
    };

    const emitToChildren = (action: GadgetAction, widgetIndex: number) => {
        dashboardEventEmitter.emit('change', action, widgetIndex);
    };

    const widgetAction = (action: GadgetAction, gadget: Widget, widgetIndex: number) => {
        switch (action.type) {
            case GadgetActionType.AddWorklog:
                setWorklogItem(action.data);
                setShowWorklogPopup(true);
                break;

            case GadgetActionType.RemoveGadget: {
                if (!currentBoardRef.current) return;
                const updatedBoard = { ...currentBoardRef.current };
                const widgets = [...(updatedBoard.widgets || [])];
                widgets.splice(widgetIndex, 1);
                updatedBoard.widgets = widgets;
                updateCurrentBoard(updatedBoard);
                saveDashboardInfo(updatedBoard);
                emitToChildren(action, widgetIndex);
                break;
            }

            case GadgetActionType.SettingsChanged:
                if (gadget) {
                    gadget.settings = action.data;
                    saveDashboardInfo();
                }
                break;

            default:
                emitToChildren(action, widgetIndex);
                break;
        }
    };

    const gadgetReordered = (widgets: Widget[]) => {
        if (!currentBoardRef.current) return;
        const updatedBoard = { ...currentBoardRef.current, widgets };
        updateCurrentBoard(updatedBoard);
        saveDashboardInfo(updatedBoard);
    };

    const renderGadget = (widget: Widget, index: number, dragDropProps?: any) => {
        const { name, settings = {} } = widget;
        const nameOpts = name.split(':');
        const gadgetName = nameOpts[0];
        const opts = nameOpts.length > 1 ? nameOpts.slice(1) : [];

        const GadgetComponent = getGadgetComponent(gadgetName, opts);

        if (!GadgetComponent) {
            return null;
        }

        const { Component, props: additionalProps } = GadgetComponent;

        const key = `${gadgetName}_${opts[0] || index}`;
        const gadgetProps = {
            gadgetType: gadgetName,
            tabLayout: isTabView,
            tabHeaderSlot: isTabView ? tabHeaderSlot : null,
            index,
            model: widget,
            settings,
            isGadget: true,
            layout: currentBoard?.layout,
            onAction: (action: any) => widgetAction(action, widget, index),
            ...additionalProps,
            draggableHandle: dragDropProps?.draggable?.dragRef,
            dropProps: dragDropProps?.droppable,
        };

        if (isTabView) {
            const title = additionalProps?.title || gadgetName;
            return (
                <TabPage key={key} header={title}>
                    <Component {...gadgetProps} />
                </TabPage>
            );
        }

        return <Component key={key} {...gadgetProps} />;
    };

    const renderGadgets = () => {
        const widgets = currentBoard?.widgets || [];

        if (!widgets.length) {
            return (
                <div className="text-center text-base rounded-lg p-20 w-full min-h-[40vh] flex items-center justify-center border-2 border-dashed border-(--border-secondary) bg-(--bg-secondary) text-secondary">
                    You haven&apos;t added any gadgets to this dashboard. Click on &quot;Add gadgets&quot; button above to start adding a
                    cool one and personalize your experience.
                </div>
            );
        }

        if (isTabView) {
            return (
                <TabView
                    scrollable
                    className="h-[calc(100vh-102px)]"
                    headerEnd={<div ref={setTabHeaderSlot} className="flex items-center gap-0.5 shrink-0" />}
                >
                    {widgets.map((widget, index) => renderGadget(widget, index))}
                </TabView>
            );
        }

        return (
            <Sortable
                className="dashboard-gadgets"
                provideDropRef
                provideDragRef
                items={widgets}
                itemType="gadget"
                onChange={gadgetReordered}
            >
                {(widget, index, dragDropProps) => renderGadget(widget, index, dragDropProps)}
            </Sortable>
        );
    };

    const onShowGadgets = () => setShowGadgetPanel(true);

    const hideGadgetDialog = () => {
        setShowGadgetPanel(false);
        saveDashboardInfo();
    };

    const worklogAdded = (e: any) => {
        emitToChildren(e, -1);
        hideWorklog();
    };

    const hideWorklog = () => setShowWorklogPopup(false);

    const tabViewChanged = (newIsTabView: boolean) => {
        setIsTabView(newIsTabView);
    };

    if (!currentBoard) {
        return <div className="p-4 text-secondary">Loading dashboard...</div>;
    }

    return (
        <>
            {!quickView && (
                <AddGadget
                    show={showGadgetPanel}
                    onHide={hideGadgetDialog}
                    addedGadgets={currentBoard.widgets || []}
                    addGadget={addGadget}
                    removeGadget={removeGadget}
                />
            )}
            <div className="page-container dashboard-container w-full p-2">
                {!quickView && (
                    <DashboardHeader
                        config={currentBoard}
                        index={dashboardIndex}
                        userId={$session.userId?.toString()!}
                        onShowGadgets={onShowGadgets}
                        tabViewChanged={tabViewChanged}
                        isQuickView={quickView}
                    />
                )}
                {renderGadgets()}
            </div>
            {showWorklogPopup && <AddWorklog worklog={worklogItem} onDone={worklogAdded} onHide={hideWorklog} />}
        </>
    );
}
