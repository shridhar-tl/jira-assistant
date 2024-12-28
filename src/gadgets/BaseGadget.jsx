import React, { PureComponent } from 'react';
import { Panel } from 'primereact/panel';
import { Tooltip } from 'primereact/tooltip';
import { EventEmitter } from 'events';
import { Button, Loader } from '../controls';
import classNames from 'classnames';
import { showContextMenu } from '../components/ContextMenu';
import { ExportHelper } from '../common/ExportHelper';
import { ExportFormat } from '../common/Exporter';
import { GadgetActionType } from './_constants';
import { inject } from '../services';
import { EventCategory } from '../constants/settings';
import { isExtnBuild } from '../constants/build-info';
import './BaseGadget.scss';

export const onDashboardEvent = new EventEmitter();
let instanceId = 0;

export class BaseGadget extends PureComponent {
    constructor(props, title) {
        super(props);
        inject(this, "AnalyticsService");
        this.instanceId = ++instanceId;

        this.title = title;
        this.isGadget = props.isGadget !== false;
        this.settings = props.settings || { fullWidth: false, fullHeight: false };

        const { fullWidth = false, fullHeight = false } = this.settings;
        this.state = { fullWidth, fullHeight };
    }

    getContextMenu() {
        const { isFullScreen, fullWidth, fullHeight } = this.state;

        const gadgetActions = !this.isGadget ? [] : [
            { separator: true },
            { label: "Full width", icon: `fa fa-${fullWidth ? "check-" : ""}circle fs-16 margin-r-5`, command: () => this.setSizeOptions(!fullWidth, fullHeight) },
            { label: "Full height", icon: `fa fa-${fullHeight ? "check-" : ""}circle fs-16 margin-r-5`, command: () => this.setSizeOptions(fullWidth, !fullHeight) },
            { separator: true },
            { label: "Remove", icon: "fa fa-remove", command: () => this.removeGadget() }
        ];

        const exportOpts = [];

        if (!this.hideExport) {
            exportOpts.push({ separator: true });

            if (!this.hideCSVExport) {
                exportOpts.push({ label: "Export to CSV", icon: "fa fa-file-text", disabled: !this.exportData, command: () => this.exportData(ExportFormat.CSV) });
            }

            if (!this.hideXLSXExport) {
                exportOpts.push({ label: "Export to Excel", icon: "fa fa-file-excel", disabled: !this.exportData, command: () => this.exportData(ExportFormat.XLSX) });
            }

            if (!this.hidePDFExport) {
                exportOpts.push({ label: "Export to PDF", icon: "fa fa-file-pdf", disabled: !this.exportData, command: () => this.exportData(ExportFormat.PDF) });
            }
        }

        return [
            //{ label: "Refresh", icon: "fa fa-refresh", disabled: !this.refreshData || this.state.isLoading, command: () => this.refreshData(true) },
            { label: "Toggle full screen", icon: `fa fa-${isFullScreen ? "compress" : "expand"}`, command: () => this.toggleFullScreen() },
            ...exportOpts,
            ...gadgetActions
        ];
    }

    componentDidMount() {
        if (this.isGadget) {
            onDashboardEvent.on("change", this.eventReceived);
            this.$analytics.trackEvent("Gadget loaded", EventCategory.GadgetActions, this.title);
        }
        this._isMounted = true;
        //this.widgetCtl = $(this.el).closest('.widget-cntr');
        //this.widgetHdrCtl = this.widgetCtl.find('div.ui-panel-titlebar.ui-widget-header');
    }

    eventReceived = (e) => this.executeEvent(e);

    componentWillUnmount() {
        onDashboardEvent.off("change", this.eventReceived);
    }

    setSizeOptions(fullWidth, fullHeight) {
        const { settings } = this;

        settings.fullWidth = fullWidth;
        settings.fullHeight = fullHeight;

        this.setState({ fullWidth, fullHeight });

        this.saveSettings();
    }

    UNSAFE_componentWillReceiveProps(changes) {
        if (this.settings !== changes.settings) {
            this.settings = changes.settings || {};

            const { fullWidth, fullHeight } = this.settings;
            this.setState({ fullWidth, fullHeight });
        }
    }

    toggleFullScreen = () => {
        let { isFullScreen } = this.state;
        isFullScreen = !isFullScreen;
        this.$analytics.trackEvent("Toggle full screen", EventCategory.GadgetActions, this.title, isFullScreen);
        if (isFullScreen) {
            document.body.classList.add('fs-layout');
        }
        else {
            document.body.classList.remove('fs-layout');
        }
        this.columnResizeMode = isFullScreen ? 'fit' : 'expand';
        this.setState({ isFullScreen });
    };

    performAction(type, data) {
        const { onAction } = this.props;
        if (onAction) { onAction({ type, data }, this.props.model, this.props.index); }
    }

    addWorklog(data) {
        this.performAction(GadgetActionType.AddWorklog, data);
    }

    addWorklogOn = (ticketNo) => {
        this.addWorklog({ ticketNo: ticketNo });
    };

    editWorklog(worklogId) {
        this.performAction(GadgetActionType.AddWorklog, { id: worklogId });
    }

    removeGadget = () => {
        this.$analytics.trackEvent("Gadget removed", EventCategory.GadgetActions, this.title);
        this.performAction(GadgetActionType.RemoveGadget);
    };

    saveSettings() {
        this.performAction(GadgetActionType.SettingsChanged, this.settings);
    }

    executeEvent(action) {
        /* This function has to be overridden in gadgets if needed */
    }

    getFullScreenButton() {
        if (this.isGadget) { return null; }
        const { state: { isFullScreen } } = this;
        return <Button text icon={isFullScreen ? 'fa fa-compress' : 'fa fa-expand'} onClick={this.toggleFullScreen} title="Toggle full screen" />;
    }

    getRefreshButton(callback) {
        const { disableRefresh, isLoading } = this.state;

        return <Button text icon="fa fa-refresh" disabled={disableRefresh || isLoading} onClick={callback || this.refreshData} title="Refresh data" />;
    }

    setLoader = (isLoading) => this.setState({ isLoading });

    exportData = (exportFormat) => {
        const exportHelper = new ExportHelper();
        exportHelper.fileName = this.title;
        exportHelper.format = exportFormat || this.exportFormat;
        exportHelper.element = this.el;
        this.$analytics.trackEvent("Export data", EventCategory.GadgetActions, exportHelper.format);
        exportHelper.export();
    };

    showGadgetContextMenu = (e) => showContextMenu(e, this.getContextMenu());

    getTooltipElement() {
        if (!this.getHint) { return null; }

        return (<>
            <Tooltip target={`.icon-hint-${this.instanceId}`} >
                {this.getHint()}
            </Tooltip>
            <i className={`fa fa-info-circle icon-hint icon-hint-${this.instanceId}`} data-pr-position="bottom" />
        </>);
    }

    getHeader = () => {
        const { title, subTitle, isGadget, props: { draggableHandle } } = this;
        const className = `gadget-header${draggableHandle ? " movable" : ""}`;

        return <>
            <div ref={draggableHandle} className={className} onContextMenu={!isGadget ? null : this.showGadgetContextMenu} onDoubleClick={this.toggleFullScreen}>
                {title} {subTitle && <span> - {subTitle}</span>}
                <div className="float-end">
                    {this.getTooltipElement()}
                    {this.renderCustomActions && this.renderCustomActions(isGadget)}
                    {!this.hideRefresh && this.getRefreshButton()}
                    {!this.hideMenu && <Button text icon="fa fa-wrench" onClick={e => showContextMenu(e, this.getContextMenu())} />}
                </div>
            </div>
            <div className="clearfix"></div>
        </>;
    };

    setRef = (el) => {
        this.el = el;
        const { dropProps: { dropRef } = {} } = this.props;

        if (dropRef) {
            dropRef(el);
        }
    };

    renderBase(children) {
        const { fullWidth, fullHeight, isLoading, isFullScreen } = this.state;
        const {
            isGadget, props: { tabLayout, gadgetType }
        } = this;

        if (tabLayout) {
            return <>
                {children}
                {this.renderFooter && this.renderFooter()}
            </>;
        }

        const fw = fullWidth || !isGadget;
        const fh = fullHeight || !isGadget;

        const className = classNames("gadget", this.className, {
            "docked": !isGadget,
            "full-width": fw && !isFullScreen,
            "full-height": fh && !isFullScreen,
            "half-width": !fw && !isFullScreen,
            "half-height": !fh && !isFullScreen,
            "full-screen": isFullScreen
        });

        return (<div ref={this.setRef} className={className} data-test-id={gadgetType}>
            {isLoading && <Loader />}
            <Panel header={this.getHeader()}>
                {children}
                {this.renderFooter && this.renderFooter()}
            </Panel>
        </div>);
    }

    render() {
        return (<div ref={this.setRef} className="gadget half-width half-height">
            <Panel header="Gadget Unavailable">
                <div className="pad-22">
                    This section contains an un-known gadget.
                    {isExtnBuild && 'You could have added a new Gadget from Web version which is not yet available in extension. '}
                    {isExtnBuild && 'If not, please report about this issue to have it fixed!'}
                    {!isExtnBuild && 'Please report about this issue to have it fixed!'}
                </div>
            </Panel>
        </div>);
    }
}

export default BaseGadget;

export { GadgetActionType };