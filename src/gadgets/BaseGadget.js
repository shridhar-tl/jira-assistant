import React, { PureComponent } from 'react';
import { Panel } from 'primereact/panel';
import $ from 'jquery';
import { EventEmitter } from 'events';
import Button from '../controls/Button';
import classNames from "classnames";
import { showContextMenu } from '../controls/ContextMenu';
import "./BaseGadget.scss";
import { ExportHelper } from '../common/ExportHelper';
import { ExportFormat } from '../common/Exporter';

export const onDashboardEvent = new EventEmitter();

export class BaseGadget extends PureComponent {
    constructor(props, title, iconClass) {
        super(props);
        this.title = title;
        this.iconClass = iconClass;
        this.isGadget = props.isGadget !== false;
        this.settings = props.settings || { fullWidth: false, fullHeight: false };
        this.bodyTag = $(document.body);

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

        const exportOpts = this.hideExport ? [] : [
            { separator: true },
            { label: "Export to CSV", icon: "fa fa-file-text-o", disabled: !this.exportData, command: () => this.exportData(ExportFormat.CSV) },
            { label: "Export to Excel", icon: "fa fa-file-excel-o", disabled: !this.exportData, command: () => this.exportData(ExportFormat.XLSX) }
        ];

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
        }
        this.widgetCtl = $(this.el).closest('.widget-cntr');
        this.widgetHdrCtl = this.widgetCtl.find('div.ui-panel-titlebar.ui-widget-header');
    }

    eventReceived = (e) => this.executeEvent(e)

    componentWillUnmount() {
        onDashboardEvent.off("change", this.eventReceived);
    }

    onResize(event) {
        setTimeout(() => {
            this.totalHeight = this.isFullScreen ? window.innerHeight : this.widgetCtl.height();
            this.contentHeight = this.totalHeight + (this.hideHeader ? 0 : -((this.widgetHdrCtl.outerHeight() || 44) + 3));
        }, 20);
    }

    setSizeOptions(fullWidth, fullHeight) {
        const { settings } = this;

        settings.fullWidth = fullWidth;
        settings.fullHeight = fullHeight;

        this.setState({ fullWidth, fullHeight });

        this.saveSettings();
    }

    UNSAFE_componentWillReceiveProps(changes) {
        if (changes.layout) {
            this.onResize();
        }

        if (this.settings !== changes.settings) {
            this.settings = changes.settings || {};

            const { fullWidth, fullHeight } = this.settings;
            this.setState({ fullWidth, fullHeight });
        }
    }

    toggleFullScreen = () => {
        let { isFullScreen } = this.state;
        isFullScreen = !isFullScreen;
        if (isFullScreen) {
            this.bodyTag.addClass('fs-layout');
        }
        else {
            this.bodyTag.removeClass('fs-layout');
        }
        this.columnResizeMode = isFullScreen ? 'fit' : 'expand';
        this.setState({ isFullScreen });
        this.onResize();
    }

    performAction(type, data) {
        const { onAction } = this.props;
        if (onAction) { onAction({ type, data }, this.props.model, this.props.index); }
    }

    addWorklog(data) {
        this.performAction(GadgetActionType.AddWorklog, data);
    }

    addWorklogOn(ticketNo) {
        this.addWorklog({ ticketNo: ticketNo });
    }

    editWorklog(worklogId) {
        this.performAction(GadgetActionType.AddWorklog, { id: worklogId });
    }

    removeGadget = () => {
        this.performAction(GadgetActionType.RemoveGadget);
    }

    saveSettings() {
        this.performAction(GadgetActionType.SettingsChanged, this.settings);
    }

    executeEvent(action) {
        if (action.type === GadgetActionType.RemoveGadget) {
            this.onResize();
        }
    }

    getFullScreenButton() {
        if (this.isGadget) { return null; }
        const { state: { isFullScreen } } = this;
        return <Button icon={isFullScreen ? 'fa fa-compress' : 'fa fa-expand'} onClick={super.toggleFullScreen} title="Toggle full screen" />;
    }

    getRefreshButton(callback) {
        const { disableRefresh, isLoading } = this.state;

        return <Button icon="fa fa-refresh" disabled={disableRefresh || isLoading} onClick={callback || this.refreshData} title="Refresh data" />;
    }

    exportData = (exportFormat) => {
        const exportHelper = new ExportHelper();
        exportHelper.fileName = this.title;
        exportHelper.format = exportFormat || this.exportFormat;
        exportHelper.element = this.el;
        exportHelper.export();
    }

    getExportButton(disabled) {
        if (this.isGadget) { return null; }

        return <Button icon="fa fa-download" disabled={disabled} onClick={this.exportData} title={this.exportFormat === ExportFormat.XLSX ? "Export to Excel" : "Export to csv"} />;
    }

    getHeader = () => {
        const { title, subTitle, isGadget } = this;
        return <div className="gadget-header" onContextMenu={!isGadget ? null : (e) => showContextMenu(e, this.getContextMenu())} onDoubleClick={this.toggleFullScreen}>
            <i className={`fa ${this.iconClass}`}></i> {title} {subTitle && <span> - {subTitle}</span>}
            <div className="pull-right">
                {this.renderCustomActions && this.renderCustomActions()}
                {!this.hideRefresh && this.getRefreshButton()}
                {!this.hideMenu && <Button icon="fa fa-wrench" onClick={e => showContextMenu(e, this.getContextMenu())} />}
            </div>
        </div>;
    }

    renderBase(childern) {
        const { fullWidth, fullHeight, isLoading, isFullScreen } = this.state;
        const {
            isGadget, props: { tabLayout }
        } = this;

        if (tabLayout) {
            return <>
                {childern}
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

        return (<div ref={el => this.el = el} className={className}>
            {isLoading && <div className="data-loader"><i className="fa fa-refresh fa-spin"></i></div>}
            <Panel header={this.getHeader()}>
                {childern}
                {this.renderFooter && this.renderFooter()}
            </Panel>
        </div>);
    }

    render() {
        return (<div ref={el => this.el = el} className="gadget half-width half-height">
            <Panel header="Gadget Unavailable">
                <div className="pad-22">
                    This section contains an un-known gadget.
                    Please report about this issue to have it fixed!
                </div>
            </Panel>
        </div>);
    }
}

export default BaseGadget;

export const GadgetActionType = {
    None: 0,
    AddWorklog: 1,
    WorklogModified: 2,
    DeletedWorklog: 3,
    TicketBookmarked: 10,
    SettingsChanged: 20,
    RemoveGadget: 100
};