import React, { PureComponent } from 'react';
import IssueCollection from './IssueCollection';
import CardsCollection from './CardsCollection';
import ControlBox from './ControlBox';
import MembersList from './MembersList';
import { connect } from './store';
import { watchRoom } from './actions';
import Header from './Header';
import InfoBox from './InfoBox';

class Room extends PureComponent {
    componentDidMount() {
        this.unsubscribe = this.props.watchRoom(this.props.roomId);
    }

    componentWillUnmount() {
        if (typeof this.unsubscribe === 'function') {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    render() {
        return (
            <div>
                <Header />
                <InfoBox />
                <MembersList />
                <IssueCollection />
                <ControlBox />
                <CardsCollection />
            </div>
        );
    }
}

export default connect(Room, (state) => ({ roomId: state.roomId }), { watchRoom });