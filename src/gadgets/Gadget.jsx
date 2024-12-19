import React, { useState, useEffect } from 'react';
import { Panel } from 'primereact/panel';
import { Tooltip } from 'primereact/tooltip';
//import { EventEmitter } from 'events';
import { Button, Loader } from '../controls';
import classNames from 'classnames';
import { showContextMenu } from '../components/ContextMenu';
import { ExportHelper } from '../common/ExportHelper';
import { ExportFormat } from '../common/Exporter';
import { GadgetActionType } from './_constants';
import { inject } from '../services';
import { EventCategory } from '../constants/settings';
import './BaseGadget.scss';

//export const onDashboardEvent = new EventEmitter();

function GadgetLayout(props) {
    const {
        title, iconClass, hideRefresh, gadgetHint, hideMenu, isLoading,
        customActions,
        onRefresh,
        settings: propsSettings
    } = props;

    const $this = React.useRef({});

    const isGadget = props.isGadget !== false;
    const settings = propsSettings || { fullWidth: false, fullHeight: false };

    const [fullWidth, setFullWidth] = useState(settings.fullWidth || false);
    const [fullHeight, setFullHeight] = useState(settings.fullHeight || false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const instanceId = React.useId();

    useEffect(() => {
        if (!propsSettings) {
            return;
        }
        setFullWidth(propsSettings.fullWidth);
        setFullHeight(propsSettings.fullHeight);
    }, [propsSettings]);

    const { $analytics } = inject('AnalyticsService');

    /*
    useEffect(() => {
        if (isGadget) {
            const eventReceived = (e) => executeEvent(e);
            onDashboardEvent.on("change", eventReceived);
            $analytics.trackEvent("Gadget loaded", EventCategory.GadgetActions, title);
            return () => {
                onDashboardEvent.off("change", eventReceived);
            };
        }
    }, []);

    const executeEvent = (action) => {
        /* This function has to be overridden in gadgets if needed * /
    };*/


    /*
    const addWorklog = (data) => {
        performAction(GadgetActionType.AddWorklog, data);
    };

    const addWorklogOn = (ticketNo) => {
        addWorklog({ ticketNo: ticketNo });
    };

    const editWorklog = (worklogId) => {
        performAction(GadgetActionType.AddWorklog, { id: worklogId });
    };
    */

    const setSizeOptions = (newFullWidth, newFullHeight) => {
        settings.fullWidth = newFullWidth;
        settings.fullHeight = newFullHeight;
        setFullWidth(newFullWidth);
        setFullHeight(newFullHeight);
        saveSettings();
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
        // Assuming you have access to the `$analytics` object
        // $analytics.trackEvent("Toggle full screen", EventCategory.GadgetActions, title, !isFullScreen);
        if (!isFullScreen) {
            document.body.classList.add('fs-layout');
        } else {
            document.body.classList.remove('fs-layout');
        }
    };

    const performAction = (type, data) => {
        if (props.onAction) {
            props.onAction({ type, data }, props.model, props.index);
        }
    };

    $this.current.props = props;
    $this.current.isGadget = isGadget;
    $this.current.fullWidth = fullWidth;
    $this.current.fullHeight = fullHeight;
    $this.current.isFullScreen = isFullScreen;
    $this.current.$analytics = $analytics;
    $this.current.setSizeOptions = setSizeOptions;
    $this.current.toggleFullScreen = toggleFullScreen;
    $this.current.performAction = performAction;

    const saveSettings = () => {
        performAction(GadgetActionType.SettingsChanged, settings);
    };

    const getRefreshButton = (callback) => {
        const disableRefresh = false; // You need to define this
        return (
            <Button
                text
                icon="fa fa-refresh"
                disabled={disableRefresh || isLoading}
                onClick={callback || onRefresh}
                title="Refresh data"
            />
        );
    };

    const showGadgetContextMenu = (e) => showContextMenu(e, getContextMenu($this.current));

    const getTooltipElement = () => {
        if (!gadgetHint) {
            return null;
        }

        return (
            <>
                <Tooltip target={`.icon-hint-${instanceId}`}>
                    {gadgetHint}
                </Tooltip>
                <i className={`fa fa-info-circle icon-hint icon-hint-${instanceId}`} data-pr-position="bottom" />
            </>
        );
    };

    const showSettingsMenu = React.useCallback((e) => showContextMenu(e, getContextMenu($this.current)), []);

    const getHeader = () => {
        const { subTitle, draggableHandle } = props;
        const className = `gadget-header${draggableHandle ? " movable" : ""}`;

        return (
            <>
                <div
                    ref={draggableHandle}
                    className={className}
                    onContextMenu={!isGadget ? null : showGadgetContextMenu}
                    onDoubleClick={toggleFullScreen}
                >
                    <i className={`fa ${iconClass}`}></i> {title} {subTitle && <span> - {subTitle}</span>}
                    <div className="float-end">
                        {getTooltipElement()}
                        {customActions}
                        {!hideRefresh && getRefreshButton()}
                        {!hideMenu && <Button text icon="fa fa-wrench" onClick={showSettingsMenu} />}
                    </div>
                </div>
                <div className="clearfix"></div>
            </>
        );
    };

    const setRef = (el) => {
        $this.current.rootEl = el;
        const { dropProps: { dropConnector } = {} } = props;
        if (dropConnector) {
            dropConnector(el);
        }
    };

    const { children, tabLayout, gadgetType } = props;

    if (tabLayout) {
        return (
            <>
                {children}
                {/* renderFooter logic */}
            </>
        );
    }

    const fw = fullWidth || !isGadget;
    const fh = fullHeight || !isGadget;

    const className = classNames("gadget", props.className, {
        "docked": !isGadget,
        "full-width": fw && !isFullScreen,
        "full-height": fh && !isFullScreen,
        "half-width": !fw && !isFullScreen,
        "half-height": !fh && !isFullScreen,
        "full-screen": isFullScreen,
    });

    return (
        <div ref={setRef} className={className} data-test-id={gadgetType}>
            {isLoading && <Loader />}
            <Panel header={getHeader()}>
                {children}
                {/* renderFooter logic */}
            </Panel>
        </div>
    );
}

export default GadgetLayout;
export { GadgetActionType };

function getContextMenu($this) {
    const removeGadget = () => {
        $analytics.trackEvent("Gadget removed", EventCategory.GadgetActions, title);
        performAction(GadgetActionType.RemoveGadget);
    };

    const {
        $analytics, performAction,
        isGadget,
        isFullScreen, fullWidth, fullHeight, rootEl,
        setSizeOptions,
        toggleFullScreen,
        props: {
            title, hideExport, hideCSVExport, hideXLSXExport, hidePDFExport
        }
    } = $this;

    const gadgetActions = !isGadget ? [] : [
        { separator: true },
        { label: "Full width", icon: `fa fa-${fullWidth ? "check-" : ""}circle fs-16 margin-r-5`, command: () => setSizeOptions(!fullWidth, fullHeight) },
        { label: "Full height", icon: `fa fa-${fullHeight ? "check-" : ""}circle fs-16 margin-r-5`, command: () => setSizeOptions(fullWidth, !fullHeight) },
        { separator: true },
        { label: "Remove", icon: "fa fa-remove", command: removeGadget }
    ];

    const exportOpts = [];

    if (!hideExport) {
        exportOpts.push({ separator: true });

        if (!hideCSVExport) {
            exportOpts.push({ label: "Export to CSV", icon: "fa fa-file-text", command: () => exportData(ExportFormat.CSV, title, rootEl, $analytics) });
        }

        if (!hideXLSXExport) {
            exportOpts.push({ label: "Export to Excel", icon: "fa fa-file-excel", command: () => exportData(ExportFormat.XLSX, title, rootEl, $analytics) });
        }

        if (!hidePDFExport) {
            exportOpts.push({ label: "Export to PDF", icon: "fa fa-file-pdf", command: () => exportData(ExportFormat.PDF, title, rootEl, $analytics) });
        }
    }

    return [
        //{ label: "Refresh", icon: "fa fa-refresh", disabled: !this.refreshData || this.state.isLoading, command: () => this.refreshData(true) },
        { label: "Toggle full screen", icon: `fa fa-${isFullScreen ? "compress" : "expand"}`, command: () => toggleFullScreen() },
        ...exportOpts,
        ...gadgetActions
    ];
}

function exportData(exportFormat, fileName, rootEl, $analytics) {
    const exportHelper = new ExportHelper();
    exportHelper.fileName = fileName;
    exportHelper.format = exportFormat || exportFormat; // You need to define this
    exportHelper.element = rootEl;
    // Assuming you have access to the `$analytics` object
    $analytics.trackEvent("Export data", EventCategory.GadgetActions, exportHelper.format);
    exportHelper.export();
}