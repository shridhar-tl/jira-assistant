import React, { useRef, useState, useCallback } from 'react';
import { connect } from './store';
import RapidViewList from '../../../components/RapidViewList';
import { setSelectedBoard } from './store/actions';
import { Menubar } from 'primereact/menubar';
import { OverlayPanel } from 'primereact/overlaypanel';
import Settings from './Settings';

function getMenuItem(icon, label, onClick) {
    const template = (<span role="menuitem" className="p-menuitem-link" onClick={onClick}>
        <span className={`p-menuitem-icon ${icon}`} />
        <span className="p-menuitem-text">{label}</span>
    </span>);

    return { icon, label, template };
}

const Header = connect(function ({ selectedBoard, onTabChange }) {
    const [isSettingsVisible, showSettings] = useState(false);
    const toggleSettings = useCallback(() => showSettings(visible => !visible), [showSettings]);

    const menuItems = [
        getMenuItem('fa fa-users', 'Planner', () => onTabChange(0)),
        getMenuItem('fa fa-calendar', 'Calendar', () => onTabChange(1)),
        getMenuItem('fa fa-calendar', 'Capacity', () => onTabChange(2)),
        getMenuItem('fa fa-cogs', 'Config', toggleSettings)
    ];

    const start = (<div>
        <img src="/assets/icon_32.png" alt="JA" className="logo" />
        <div className="title">
            <span className="info">PLANNING</span>
            {!selectedBoard && <h1 className="board-name">&lt;&lt; No board selected &gt;&gt;</h1>}
            {selectedBoard && <h1 className="board-name">{selectedBoard.name}</h1>}
        </div>
        <BoardPicker />
    </div>);

    return (<div className="pl-header">
        <Menubar model={menuItems} start={start} />
        <Settings visible={isSettingsVisible} onHide={toggleSettings} />
    </div>);
}, ({ selectedBoard }) => ({ selectedBoard }));

export default React.memo(Header);

const BoardPicker = connect(function ({ board, onChange }) {
    const op = useRef(null);
    const showBoards = (e) => op.current.toggle(e);
    const changeHandler = useCallback((val) => { onChange(val); op.current.hide(); }, [onChange, op]);

    return (<>
        <span className="picker fa fa-chevron-down" onClick={showBoards} />
        <OverlayPanel ref={op} style={{ width: '350px' }}>
            <RapidViewList value={board || ''} multiple={false} onChange={changeHandler} />
        </OverlayPanel>
    </>);
}, ({ selectedBoard: board }) => ({ board }),
    { onChange: setSelectedBoard });