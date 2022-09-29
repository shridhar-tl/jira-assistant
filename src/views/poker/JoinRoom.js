import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { TextBox, Button } from '../../controls';
import { connect } from './store';
import { joinRoom, loadAuthInfoFromCache } from './actions';
import { withRouter } from '../../pollyfills';

class JoinRoom extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            scoreType: 1, hasError: true,
            roomId: props.match?.params?.roomId || ''
        };
    }

    componentDidMount() {
        this.props.loadAuthInfoFromCache(this.state.roomId);
    }

    joinRoom = async () => {
        try {
            const { roomId } = await this.props.joinRoom(this.state);
            this.props.navigate(`/poker/${roomId}`);
        } catch (err) {
            console.error(err);
        }
    };

    setValue = (val, field) => {
        const newState = { ...this.state, [field]: val };

        newState.roomError = (newState.roomId || '').length < 6 ? 'Room id is too short' : null;
        newState.nameError = (newState.name || '').length < 3 ? 'Name is too short' : null;
        newState.emailError = (newState.email || '').length < 3 ? 'Email is too short' : null;

        newState.hasError = !!(newState.roomError || newState.nameError || newState.emailError);

        this.setState(newState);
    };

    render() {
        const { roomId, name, email, roomError, nameError, emailError, hasError } = this.state;

        return (
            <div className="poker-create">
                <div className="flex justify-content-center">
                    <div className="card">
                        <h5 className="text-center">Join Room</h5>
                        <div className="p-fluid">
                            <div className="field">
                                <span className="p-float-label">
                                    <TextBox id="roomId" field="roomId" value={roomId} maxLength={15} autoFocus
                                        className={classNames({ 'p-invalid': roomError })} onChange={this.setValue} />
                                    <label htmlFor="roomId" className={classNames({ 'p-error': !!roomError })}>Room Id*</label>
                                </span>
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <TextBox id="name" value={name} field="name" maxLength={15} className={classNames({ 'p-invalid': nameError })}
                                        onChange={this.setValue} />
                                    <label htmlFor="name" className={classNames({ 'p-error': !!nameError })}>Your Name*</label>
                                </span>
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <TextBox id="email" value={email} field="email" maxLength={80} className={classNames({ 'p-invalid': emailError })}
                                        onChange={this.setValue} />
                                    <label htmlFor="name" className={classNames({ 'p-error': !!nameError })}>Your Email*</label>
                                </span>
                            </div>

                            <Button label="JOIN ROOM" className="mt-2" disabled={hasError} onClick={this.joinRoom} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(withRouter(JoinRoom), null, { joinRoom, loadAuthInfoFromCache });