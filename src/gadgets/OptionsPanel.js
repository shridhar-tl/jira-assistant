import React from "react";
import classNames from "classnames";
import { Panel } from "primereact/panel";
import { Button } from "../controls";
import { showContextMenu } from "../externals/jsd-report";

function OptionsPanel(props) {
    const [isFullScreen, setFullScreen] = React.useState(false);
    const toggleFullScreen = React.useCallback(() => setFullScreen(state => !state), []);

    const {
        isLoading,
        children,
        testId
    } = props;

    const className = getClassNames(props, isFullScreen);
    const header = getHeader(props, { toggleFullScreen });

    return (<div ref={this.setRef} className={className} data-test-id={testId}>
        {isLoading && <div className="data-loader"><i className="fa fa-refresh fa-spin"></i></div>}
        <Panel header={header}>
            {children}
        </Panel>
    </div>);
}

export default OptionsPanel;

function OptionsPanelHeader({
    title, subTitle, icon,
    draggableHandle,
    hideRefresh,
    hideMenu,
    disableRefresh,
    isLoading,
    toggleFullScreen,
    showContextMenu,
    onRefresh,
    showMenu,
    controls
}) {
    const className = `gadget-header${draggableHandle ? " movable" : ""}`;

    return <>
        <div ref={draggableHandle}
            className={className}
            onContextMenu={showContextMenu}
            onDoubleClick={toggleFullScreen}>
            <i className={`fa ${icon}`}></i> {title} {subTitle && <span> - {subTitle}</span>}
            <div className="float-end">
                {controls}
                {!hideRefresh && <Button
                    icon="fa fa-refresh"
                    disabled={disableRefresh || isLoading}
                    onClick={onRefresh}
                    title="Refresh data"
                />}
                {!hideMenu && <Button
                    icon="fa fa-wrench"
                    onClick={showMenu}
                />}
            </div>
        </div>
        <div className="clearfix"></div>
    </>;
}

function getHeader(props, otherProps) {
    return (<OptionsPanelHeader
        {...props}
        {...otherProps}
    />);
}

function getClassNames({
    fullWidth,
    fullHeight,
    docked,
    className
}, isFullScreen) {
    return classNames("gadget", className, {
        "docked": docked,
        "full-width": fullWidth && !isFullScreen,
        "full-height": fullHeight && !isFullScreen,
        "half-width": !fullWidth && !isFullScreen,
        "half-height": !fullHeight && !isFullScreen,
        "full-screen": isFullScreen
    });
}