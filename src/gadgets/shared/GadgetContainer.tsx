import React from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { Button, hideTooltip, Loading, showContextMenu, showTooltip } from '@components';

import type { BaseGadgetConfig, BaseGadgetProps } from './types';
import type { useBaseGadget } from './useBaseGadget';

interface GadgetContainerProps extends BaseGadgetProps {
    children: React.ReactNode;
    subTitle?: string;
    config?: Partial<BaseGadgetConfig>;
    gadgetHook: ReturnType<typeof useBaseGadget>;
    customActions?: React.ReactNode;
    footer?: React.ReactNode;
    hint?: React.ReactNode;
    refreshData?: () => void;
    loadingProgress?: number;
}

export function GadgetContainer({
    children,
    subTitle,
    config: configOverride,
    gadgetHook,
    customActions,
    footer,
    hint,
    refreshData,
    loadingProgress,
    tabLayout,
    tabHeaderSlot,
    draggableHandle,
    dropProps,
    isGadget: isGadgetProp,
    gadgetType,
}: GadgetContainerProps) {
    const {
        config: gadgetConfig,
        elementRef,
        fullWidth,
        fullHeight,
        isFullScreen,
        isLoading,
        disableRefresh,
        toggleFullScreen,
        showGadgetContextMenu,
        getContextMenu,
    } = gadgetHook;

    const config = configOverride ? { ...gadgetConfig, ...configOverride } : gadgetConfig;
    const title = config.title;

    const isGadget = isGadgetProp !== false;

    const headerActions = (
        <>
            {hint && (
                <i
                    className="fa fa-info-circle text-amber-500 text-lg cursor-help mr-1"
                    onMouseEnter={(e) => showTooltip(e, { content: hint, placement: 'bottomLeft' })}
                    onMouseLeave={() => hideTooltip()}
                />
            )}
            {customActions}
            {!config.hideRefresh && refreshData && (
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-refresh" />}
                    disabled={disableRefresh || isLoading}
                    onClick={refreshData}
                    title="Refresh data"
                    size="sm"
                />
            )}
            {!config.hideMenu && (
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-bars" />}
                    onClick={(e: any) => showContextMenu(e, getContextMenu())}
                    title="Gadget options"
                    size="sm"
                />
            )}
        </>
    );

    const renderHeader = () => {
        const headerClassName = classNames('gadget-header flex items-center justify-between', {
            movable: !!draggableHandle,
        });

        return (
            <div
                ref={draggableHandle}
                className={headerClassName}
                onContextMenu={!isGadget ? undefined : showGadgetContextMenu}
                onDoubleClick={toggleFullScreen}
            >
                <div className="flex items-center gap-1 ms-2 font-semibold text-sm truncate">
                    {title}
                    {subTitle && <span className="font-normal text-secondary"> - {subTitle}</span>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    {headerActions}
                </div>
            </div>
        );
    };

    const setRef = (el: HTMLDivElement | null) => {
        const gadgetElementRef = elementRef as React.RefObject<HTMLDivElement | null>;
        if (gadgetElementRef) {
            gadgetElementRef.current = el;
        }
        if (dropProps?.dropRef) {
            dropProps.dropRef(el);
        }
    };

    if (tabLayout) {
        return (
            <>
                {tabHeaderSlot && createPortal(headerActions, tabHeaderSlot)}
                {children}
                {footer}
            </>
        );
    }

    const fw = fullWidth || !isGadget;
    const fh = fullHeight || !isGadget;

    const className = classNames('gadget', config.className, {
        docked: !isGadget,
        'full-width': fw && !isFullScreen,
        'full-height': fh && !isFullScreen,
        'half-width': !fw && !isFullScreen,
        'half-height': !fh && !isFullScreen,
        'full-screen': isFullScreen,
    });

    return (
        <div ref={setRef} className={className} data-test-id={gadgetType}>
            <div className="p-panel">
                <div className="p-panel-header">{renderHeader()}</div>
                <div className="p-panel-content relative">
                    {isLoading && typeof loadingProgress !== 'number' && (
                        <div
                            className="absolute inset-0 z-10 flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
                        >
                            <Loading size="lg" />
                        </div>
                    )}
                    {isLoading && typeof loadingProgress === 'number' && (
                        <div
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
                        >
                            <div className="relative w-20 h-20">
                                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                                    <circle
                                        cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 34}`}
                                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - loadingProgress / 100)}`}
                                        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                                    {Math.round(loadingProgress)}%
                                </span>
                            </div>
                        </div>
                    )}
                    {children}
                    {footer}
                </div>
            </div>
        </div>
    );
}
