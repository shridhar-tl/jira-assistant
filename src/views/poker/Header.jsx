import React from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { connect } from './store';
import { setAvatar, showSettings } from './actions';
import UserAvatar, { Avatar } from './Avatar';
import { useRef } from 'react';
import { Avatars } from './constants';
import './Header.scss';

function Header({ roomName, showSettings }) {
    return (<div className="header">
        <span className="fa fa-cogs" onClick={showSettings} />
        <MemberAvator />
        <div className="header-txt"><h1><img src="/assets/icon_48.png" alt="" /> Poker - [{roomName}]</h1></div>
    </div>);
}

export default connect(Header, ({ roomName }) => ({ roomName }), { setAvatar, showSettings });

const MemberAvator = connect(React.memo(function ({ setAvatar }) {
    const op = useRef(null);
    const showAvatars = (e) => op.current.toggle(e);

    return (<>
        <UserAvatar onClick={showAvatars} />
        <OverlayPanel className="avatars-overlay" ref={op} showCloseIcon dismissable>
            <div className="panel-avarars">
                <UserAvatar avatarId={null} onClick={setAvatar} />
                {Avatars.map((_, i) => <Avatar key={i} avatarId={i} onClick={(e) => { setAvatar(i); showAvatars(e); }} />)}
            </div>
        </OverlayPanel></>);
}), null, { setAvatar });