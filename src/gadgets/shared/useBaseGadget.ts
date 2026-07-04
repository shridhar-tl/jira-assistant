import { useCallback, useEffect, useRef, useState } from 'react';

import { inject } from '@services';

import { showContextMenu } from '@components';

import { EventCategory, GadgetActionType, type GadgetActionTypeValue } from '@constants';

import { ExportHelper } from '../../common/export-helper';
import { ExportFormat } from '../../common/Exporter';

import type { BaseGadgetProps, BaseGadgetConfig } from './types';

let instanceCounter = 0;

export function useBaseGadget(props: BaseGadgetProps, config: BaseGadgetConfig) {
    const [fullWidth, setFullWidth] = useState(props.settings?.fullWidth || false);
    const [fullHeight, setFullHeight] = useState(props.settings?.fullHeight || false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [disableRefresh, setDisableRefresh] = useState(false);

    const instanceId = useRef(++instanceCounter);
    const elementRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(false);
    const settingsRef = useRef(props.settings || {});

    const { $analytics } = inject('AnalyticsService');

    const isGadget = props.isGadget !== false;

    useEffect(() => {
        isMounted.current = true;
        if (isGadget) {
            $analytics.trackEvent('Gadget loaded', EventCategory.GadgetActions, config.title);
        }
        return () => {
            isMounted.current = false;
        };
    }, [isGadget, config.title, $analytics]);

    useEffect(() => {
        if (props.settings) {
            settingsRef.current = props.settings;
            setFullWidth(props.settings.fullWidth || false);
            setFullHeight(props.settings.fullHeight || false);
        }
    }, [props.settings]);

    const performAction = useCallback(
        (type: GadgetActionTypeValue, data?: any) => {
            if (props.onAction) {
                props.onAction({ type, data }, props.model, props.index);
            }
        },
        [props],
    );

    const saveSettings = useCallback(() => {
        performAction(GadgetActionType.SettingsChanged, settingsRef.current);
    }, [performAction]);

    const setSizeOptions = useCallback(
        (fw: boolean, fh: boolean) => {
            settingsRef.current.fullWidth = fw;
            settingsRef.current.fullHeight = fh;
            setFullWidth(fw);
            setFullHeight(fh);
            saveSettings();
        },
        [saveSettings],
    );

    const toggleFullScreen = useCallback(() => {
        const newFullScreen = !isFullScreen;
        $analytics.trackEvent('Toggle full screen', EventCategory.GadgetActions, config.title, newFullScreen ? 1 : 0);

        if (newFullScreen) {
            document.body.classList.add('fs-layout');
        } else {
            document.body.classList.remove('fs-layout');
        }

        setIsFullScreen(newFullScreen);
    }, [isFullScreen, config.title, $analytics]);

    const removeGadget = useCallback(() => {
        $analytics.trackEvent('Gadget removed', EventCategory.GadgetActions, config.title);
        performAction(GadgetActionType.RemoveGadget);
    }, [performAction, config.title, $analytics]);

    const addWorklog = useCallback(
        (data: any) => {
            performAction(GadgetActionType.AddWorklog, data);
        },
        [performAction],
    );

    const editWorklog = useCallback(
        (worklogId: number | string) => {
            performAction(GadgetActionType.AddWorklog, { id: worklogId });
        },
        [performAction],
    );

    const exportData = useCallback(
        (exportFormat?: string) => {
            if (!elementRef.current) return;

            const exportHelper = new ExportHelper();
            exportHelper.fileName = config.title;
            exportHelper.format = exportFormat || (typeof config.exportFormat === 'string' ? config.exportFormat : ExportFormat.CSV);
            exportHelper.element = elementRef.current;
            $analytics.trackEvent('Export data', EventCategory.GadgetActions, exportHelper.format);
            exportHelper.export();
        },
        [config.title, config.exportFormat, $analytics],
    );

    const getContextMenu = useCallback((): any[] => {
        const gadgetActions: any[] = !isGadget
            ? []
            : [
                  { separator: true },
                  {
                      label: 'Full width',
                      icon: `fa fa-${fullWidth ? 'check-' : ''}circle`,
                      command: () => setSizeOptions(!fullWidth, fullHeight),
                  },
                  {
                      label: 'Full height',
                      icon: `fa fa-${fullHeight ? 'check-' : ''}circle`,
                      command: () => setSizeOptions(fullWidth, !fullHeight),
                  },
                  { separator: true },
                  { label: 'Remove', icon: 'fa fa-remove', command: removeGadget },
              ];

        const exportOpts: any[] = [];
        if (!config.hideExport) {
            exportOpts.push({ separator: true });

            if (!config.hideCSVExport) {
                exportOpts.push({ label: 'Export to CSV', icon: 'fa fa-file-text-o', command: () => exportData(ExportFormat.CSV) });
            }

            if (!config.hideXLSXExport) {
                exportOpts.push({ label: 'Export to Excel', icon: 'fa fa-file-excel-o', command: () => exportData(ExportFormat.XLSX) });
            }

            if (!config.hidePDFExport) {
                exportOpts.push({ label: 'Export to PDF', icon: 'fa fa-file-pdf-o', command: () => exportData(ExportFormat.PDF) });
            }
        }

        return [
            { label: 'Toggle full screen', icon: `fa fa-${isFullScreen ? 'compress' : 'expand'}`, command: toggleFullScreen },
            ...exportOpts,
            ...gadgetActions,
        ];
    }, [isGadget, fullWidth, fullHeight, isFullScreen, config, setSizeOptions, removeGadget, toggleFullScreen, exportData]);

    const showGadgetContextMenu = useCallback(
        (e: React.MouseEvent) => {
            showContextMenu(e, getContextMenu());
        },
        [getContextMenu],
    );

    return {
        instanceId: instanceId.current,
        config,
        elementRef,
        fullWidth,
        fullHeight,
        isFullScreen,
        isLoading,
        disableRefresh,
        setIsLoading,
        setDisableRefresh,
        performAction,
        saveSettings,
        setSizeOptions,
        toggleFullScreen,
        removeGadget,
        addWorklog,
        editWorklog,
        exportData,
        getContextMenu,
        showGadgetContextMenu,
        settingsRef,
    };
}
