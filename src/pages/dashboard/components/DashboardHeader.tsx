import React, { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { inject } from '@services';

import { Button, showContextMenu, type ContextMenuItem } from '@components';

import type { Dashboard } from '@types';

import { DashboardName } from './DashboardName';

interface DashboardHeaderProps {
    config: Dashboard;
    index: number;
    userId: string;
    onShowGadgets: () => void;
    tabViewChanged: (isTabView: boolean) => void;
    isQuickView?: boolean;
}

export function DashboardHeader({
    config: initialConfig,
    index: initialIndex,
    userId,
    onShowGadgets,
    tabViewChanged,
    isQuickView,
}: DashboardHeaderProps) {
    const [config, setConfig] = useState(initialConfig);
    const [index, setIndex] = useState(initialIndex);
    const navigate = useNavigate();

    const { $dashboard } = inject('DashboardService');

    useEffect(() => {
        setConfig(initialConfig);
        setIndex(initialIndex);
    }, [initialConfig, initialIndex]);

    const deleteDashboard = useCallback(async () => {
        await $dashboard.deleteDashboard(index);
        navigate(`/${userId}/dashboard/0`);
    }, [$dashboard, index, userId, navigate]);

    const setAsQuickView = useCallback(async () => {
        const updatedConfig = await $dashboard.setAsQuickView(config, index);
        setConfig(updatedConfig);
    }, [$dashboard, config, index]);

    const setAsTabView = useCallback(async () => {
        const updatedConfig = await $dashboard.setAsTabView(config, index);
        setConfig(updatedConfig);
        tabViewChanged(updatedConfig.isTabView || false);
    }, [$dashboard, config, index, tabViewChanged]);

    const nameChanged = useCallback(
        (name: string, icon: string) => {
            const updatedConfig = { ...config, name, icon };
            setConfig(updatedConfig);
            $dashboard.saveDashboardInfo(index, updatedConfig, true);
        },
        [config, index, $dashboard],
    );

    const showContext = useCallback(
        (e: React.MouseEvent) => {
            const menu: ContextMenuItem[] = [
                {
                    label: 'Create dashboard',
                    icon: <span className={'fa fa-plus'} />,
                    command: () => $dashboard.createDashboard(),
                    value: '',
                } as ContextMenuItem,
                {
                    label: 'Delete dashboard',
                    icon: <span className={'fa fa-trash'} />,
                    command: deleteDashboard,
                    disabled: index === 0,
                    value: '',
                } as ContextMenuItem,
            ];

            if (!isQuickView) {
                menu.push({
                    label: config.isTabView ? 'Disable tab view' : 'Show in tabs',
                    icon: <span className={config.isTabView ? 'fa fa-check-square' : 'fa fa-square'} />,
                    command: setAsTabView,
                    value: '',
                } as ContextMenuItem);

                menu.push({
                    label: config.isQuickView ? 'Quick view (active)' : 'Set as quick view',
                    icon: <span className={config.isQuickView ? 'fa fa-check-square' : 'fa fa-square'} />,
                    disabled: config.isQuickView,
                    command: setAsQuickView,
                    value: '',
                } as ContextMenuItem);
            }

            showContextMenu(e, menu as any);
        },
        [$dashboard, deleteDashboard, setAsTabView, setAsQuickView, config, index, isQuickView],
    );

    return (
        <div className="w-full flex items-center justify-between px-2 py-1 border-b border-(--border-primary) gap-2 min-h-10">
            <div className="flex-1 min-w-0">
                <DashboardName icon={config.icon} value={config.name} onChange={nameChanged} />
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <Button
                    layout="outlined"
                    variant="primary"
                    size="sm"
                    leftIcon={<i className="fa fa-cubes" />}
                    label="Add gadgets"
                    onClick={onShowGadgets}
                />
                {!isQuickView && (
                    <Button
                        layout="plain"
                        size="sm"
                        leftIcon={<i className="fa fa-ellipsis-v" />}
                        onClick={showContext}
                        title="Dashboard options"
                    />
                )}
            </div>
        </div>
    );
}
