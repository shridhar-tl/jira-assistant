import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { connect, PokerDataStore } from './store';
import JoinPoker from './JoinPoker';
import Room from './Room';
import { withRouter } from '../../pollyfills';
import './Poker.scss';

function switchPage({ roomId, match: { params: { roomId: paramRoomId } = {} } = {} }) {
    const Component = paramRoomId && roomId ? Room : JoinPoker;
    return (<Component />);
}

const SwitchPage = connect(withRouter(React.memo(switchPage)), ({ roomId }) => ({ roomId }));

const Poker = ({ hasExtensionSupport }) => (<PokerDataStore hasExtensionSupport={hasExtensionSupport}>
    <div className="poker-fallback">
        Your screensize is too small that Poker can't support. Please use a bigger screen
    </div>
    <div className="poker-container">
        <Routes>
            <Route path=":roomId" name="Planning Poker" element={<SwitchPage />} />
            <Route path="/" name="Join" element={<JoinPoker />} />
        </Routes>
    </div>
</PokerDataStore>);

export default Poker;