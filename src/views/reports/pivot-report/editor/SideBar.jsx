import React from 'react';
import classNames from 'classnames';
import { Button } from 'src/controls';
import './SideBar.scss';

function SideBar({ title, onBackClick, show, onHide, children, contentClassName, controls }) {
    return (<div className={`side-bar-container ${show ? 'open' : 'closed'}`}>
        <div className="site-bar-block">
            <div className={`header${onBackClick ? ' ps-0' : ''}`}>
                <Button className="close-icon" icon="fa fa-times"
                    onClick={onHide} title="Hide this block" />
                {controls}
                {onBackClick && <Button className="back-icon float-start" icon="fa fa-arrow-left"
                    onClick={onBackClick} title="Configure data source" />}
                <h2 className="title">{title}</h2>
            </div>
            <div className={classNames("site-bar-content", contentClassName)}>
                {children}
            </div>
        </div>
    </div>);
}

export default SideBar;
