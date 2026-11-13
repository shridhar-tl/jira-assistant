import { useCallback, useEffect, useRef, useState } from 'react';

import { view } from '@forge/bridge';
import { widgetEdit, type WidgetConfig } from '@forge/dashboards-bridge';

import type { DashboardHostType } from './dashboard-host';

interface DashboardItemConfigOptions<T extends object> {
    hostType: DashboardHostType;
    initialSettings: T;
    prepare?: (settings: T) => T;
    validate?: (settings: T) => string | null;
}

export interface DashboardItemConfig<T extends object> {
    settings: T;
    saveError: string | null;
    isWidget: boolean;
    update: (changes: Partial<T>) => void;
    submit: () => Promise<void>;
}

function toWidgetConfig<T extends object>(settings: T): WidgetConfig {
    return { ...settings } as WidgetConfig;
}

export default function useDashboardItemConfig<T extends object>({
    hostType,
    initialSettings,
    prepare,
    validate,
}: DashboardItemConfigOptions<T>): DashboardItemConfig<T> {
    const [settings, setSettings] = useState(initialSettings);
    const [saveError, setSaveError] = useState<string | null>(null);
    const settingsRef = useRef(initialSettings);
    const isWidget = hostType === 'widget';

    const finalize = useCallback(() => {
        const current = prepare ? prepare(settingsRef.current) : settingsRef.current;
        return { current, error: validate?.(current) ?? null };
    }, [prepare, validate]);

    useEffect(() => {
        if (!isWidget) {
            return;
        }

        widgetEdit
            .onProductSave(async () => {
                const { current, error } = finalize();
                if (error) {
                    throw new Error(error);
                }
                return toWidgetConfig(current);
            })
            .catch((err: unknown) => console.error('Failed to register widget save handler:', err));

        widgetEdit
            .onSaveError((error) => setSaveError(error.message))
            .catch((err: unknown) => console.error('Failed to register widget save error handler:', err));
    }, [isWidget, finalize]);

    const update = useCallback(
        (changes: Partial<T>) => {
            const updated = { ...settingsRef.current, ...changes };
            settingsRef.current = updated;
            setSettings(updated);
            setSaveError(null);
            if (isWidget) {
                widgetEdit.updateConfig(toWidgetConfig(updated)).catch((err: unknown) => console.error('Failed to update widget config:', err));
            }
        },
        [isWidget],
    );

    const submit = useCallback(async () => {
        if (isWidget) {
            return;
        }

        const { current, error } = finalize();
        if (error) {
            setSaveError(error);
            return;
        }

        await view.submit(current);
    }, [isWidget, finalize]);

    return { settings, saveError, isWidget, update, submit };
}
