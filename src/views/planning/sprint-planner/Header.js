import React, { useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { connect } from './store';
import RapidViewList from '../../../components/RapidViewList';
import { setSelectedBoard } from './store/actions';
import { OverlayPanel } from 'primereact/overlaypanel';
import Settings from './Settings';
import './Header.scss';

const menus = [
    { icon: 'fa fa-table', label: 'Sprint boards', route: '' },
    { icon: 'fa fa-users', label: 'Planner', route: 'planner' },
    { icon: 'fa fa-calendar', label: 'Capacity', route: 'capacity' },
    //{ icon: 'fa fa-calendar', label: 'Calendar',route:'' },
];

function getMenuItem(icon, label, onClick, module, route) {
    const template = (<span role="menuitem"
        className={`menu p-2${module === route ? ' active' : ''}`}
        onClick={() => onClick(route)}>
        <span className={`me-1 ${icon}`} />
        <span className="menu-text">{label}</span>
    </span>);

    return template;
}

const Header = connect(function ({ selectedBoard, module, onTabChange }) {
    const [isSettingsVisible, showSettings] = useState(false);
    const toggleSettings = useCallback(() => showSettings(visible => !visible), [showSettings]);

    const menuItems = menus.map(menu => getMenuItem(menu.icon, menu.label, onTabChange, module, menu.route))
        .concat(getMenuItem('fa fa-cogs', 'Config', toggleSettings, null));

    const start = (<div className="float-start">
        <img src="/assets/icon_32.png" alt="JA" className="logo" />
        <div className="title">
            <span className="info">PLANNING</span>
            {!selectedBoard && <h1 className="board-name">&lt;&lt; No board selected &gt;&gt;</h1>}
            {selectedBoard && <h1 className="board-name">{selectedBoard.name}</h1>}
        </div>
        <BoardPicker />
    </div>);

    return (<div className="pl-header">
        <div className="float-end menus">{menuItems}</div>
        {start}
        <Settings visible={isSettingsVisible} onHide={toggleSettings} />
    </div>);
}, ({ selectedBoard }) => ({ selectedBoard }));

export default React.memo(Header);

const BoardPicker = connect(function ({ board }) {
    const op = useRef(null);
    const showBoards = (e) => op.current.toggle(e);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const changeHandler = useCallback(({ id }) => {
        op.current.hide();

        if (board?.length) {
            navigate(`${pathname.substring(0, pathname.length - board.length)}${id}`);
        } else {
            navigate(`${pathname}/${id}`);
        }
    }, [board, pathname, navigate]);

    return (<>
        <span className="picker fa fa-chevron-down" onClick={showBoards} />
        <OverlayPanel ref={op} style={{ width: '350px' }}>
            <RapidViewList value={board || ''} multiple={false} onChange={changeHandler} />
        </OverlayPanel>
    </>);
}, ({ selectedBoard: board }) => ({ board }),
    { onChange: setSelectedBoard });