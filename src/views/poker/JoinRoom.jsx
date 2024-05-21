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
            this.setState({ isLoading: true });
            const { roomId, field, error } = await this.props.joinRoom(this.state);
            if (roomId) {
                this.props.navigate(`/poker/${roomId}`);
            } else if (field && error) {
                this.setState({ isLoading: false, [field]: error });
            }
        } catch (err) {
            this.setState({ isLoading: false });
            console.error(err);
        }
    };

    setValue = (val, field) => {
        const newState = { ...this.state, [field]: val };

        newState.roomError = (newState.roomId || '').length < 6 ? 'Room id is too short' : null;
        if (!newState.roomError) {
            newState.roomError = !(/^[a-z0-9]*$/g).test(newState.roomId) ? 'Enter room id, not room name.' : null;
        }
        newState.nameError = (newState.name || '').length < 2 ? 'Name is too short' : null;
        newState.emailError = (newState.email || '').length < 5 ? 'Email is too short' : null;

        newState.hasError = !!(newState.roomError || newState.nameError || newState.emailError);

        this.setState(newState);
    };

    render() {
        const { isLoading, roomId, name, email, roomError, nameError, emailError, hasError } = this.state;

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
                                {!!roomError && <span className="p-error">{roomError}</span>}
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <TextBox id="name" value={name} field="name" maxLength={15} className={classNames({ 'p-invalid': nameError })}
                                        onChange={this.setValue} />
                                    <label htmlFor="name" className={classNames({ 'p-error': !!nameError })}>Your Name*</label>
                                </span>
                                {!!nameError && <span className="p-error">{nameError}</span>}
                            </div>
                            <div className="field">
                                <span className="p-float-label">
                                    <TextBox id="email" value={email} field="email" maxLength={80} className={classNames({ 'p-invalid': emailError })}
                                        onChange={this.setValue} />
                                    <label htmlFor="name" className={classNames({ 'p-error': !!emailError })}>Your Email*</label>
                                </span>
                                {!!emailError && <span className="p-error">{emailError}</span>}
                            </div>

                            <Button label="JOIN ROOM" className="mt-2" disabled={hasError || isLoading} onClick={this.joinRoom} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(withRouter(JoinRoom), null, { joinRoom, loadAuthInfoFromCache });