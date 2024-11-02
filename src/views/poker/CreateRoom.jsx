import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { withRouter } from '../../pollyfills';
import { RadioButton, TextBox, Button } from '../../controls';
import { connect } from './store';
import { createRoom } from './actions';
import { scoresList } from './constants';

class CreateRoom extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            scoreType: 1, hasError: true
        };
    }

    createRoom = async () => {
        try {
            this.setState({ isLoading: true });
            const { roomId } = await this.props.createRoom(this.state);
            this.props.navigate(`/poker/${roomId}`);
        } catch (err) {
            this.setState({ isLoading: false });
            console.error(err);
        }
    };

    setValue = (val, field) => {
        const newState = { ...this.state, [field]: val };

        newState.roomError = (newState.roomName || '').length < 3 ? 'Room name is too short' : null;
        newState.emailError = (newState.email || '').length < 3 ? 'Email is invalid' : null;
        newState.nameError = (newState.name || '').length < 3 ? 'Name is too short' : null;

        newState.hasError = !!(newState.roomError || newState.nameError);

        this.setState(newState);
    };

    render() {
        const { isLoading, roomName, name, email, scoreType, roomError, nameError, hasError } = this.state;

        return (
            <div className="poker-create">
                <div className="flex justify-content-center">
                    <div className="card">
                        <h5 className="text-center">Create New Room</h5>
                        <div className="p-fluid">
                            <div className="field">
                                <span className="p-float-label">
                                    <TextBox id="roomName" field="roomName" value={roomName} maxLength={15} autoFocus
                                        className={classNames({ 'p-invalid': roomError })} onChange={this.setValue} />
                                    <label htmlFor="roomName" className={classNames({ 'p-error': !!roomError })}>Room Name*</label>
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
                                    <TextBox id="email" value={email} field="email" maxLength={80} className={classNames({ 'p-invalid': nameError })}
                                        onChange={this.setValue} />
                                    <label htmlFor="email" className={classNames({ 'p-error': !!nameError })}>Your Email*</label>
                                </span>
                            </div>
                            <div>
                                <RadioButton value={scoreType} field="scoreType" defaultValue={1}
                                    label={`Fibonacci (${scoresList[1].join(', ')})`} onChange={this.setValue} />
                            </div>
                            <div>
                                <RadioButton value={scoreType} field="scoreType" defaultValue={2}
                                    label={`Short Fibonacci (${scoresList[2].join(', ')})`} onChange={this.setValue} />
                            </div>
                            <div>
                                <RadioButton value={scoreType} field="scoreType" defaultValue={3}
                                    label={`T-Shirt (${scoresList[3].join(', ')})`} onChange={this.setValue} />
                            </div>

                            <Button label="CREATE ROOM" className="mt-2" disabled={hasError || isLoading} onClick={this.createRoom} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(connect(CreateRoom, null, { createRoom }));