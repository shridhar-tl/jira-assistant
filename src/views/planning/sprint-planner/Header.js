import { useRef } from 'react';
import { connect } from './store';
import RapidViewList from '../../../components/RapidViewList';
import { setSelectedBoard } from './store/actions';
import { Menubar } from 'primereact/menubar';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useState } from 'react';
import { useCallback } from 'react';
import Settings from './Settings';

const Header = connect(function ({ selectedBoard }) {
    const [isSettingsVisible, showSettings] = useState(false);
    const toggleSettings = useCallback(() => showSettings(visible => !visible), [showSettings]);

    const configMenuTemplate = (<span role="menuitem" className="p-menuitem-link" onClick={toggleSettings}>
        <span className="p-menuitem-icon fa fa-calendar" />
        <span className="p-menuitem-text">Config</span>
    </span>);

    const menuItems = [
        { icon: 'fa fa-users', label: 'Resources' },
        { icon: 'fa fa-calendar', label: 'Calendar' },
        { icon: 'fa fa-cogs', label: 'Config', template: configMenuTemplate }
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

export default Header;

const BoardPicker = connect(function ({ board, onChange }) {
    const op = useRef(null);

    const showBoards = (e) => op.current.toggle(e);

    return (<>
        <span className="picker fa fa-chevron-down" onClick={showBoards} />
        <OverlayPanel ref={op} style={{ width: '350px' }}>
            <RapidViewList value={board || ''} multiple={false} onChange={onChange} />
        </OverlayPanel>
    </>);
}, ({ selectedBoard: board }) => ({ board }),
    { onChange: setSelectedBoard });