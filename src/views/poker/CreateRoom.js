import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { RadioButton, TextBox, Button } from '../../controls';
import { connect } from './store';
import { createRoom } from './actions';

class CreateRoom extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            scoreType: 1, hasError: true,
            roomName: 'Optimus',
            name: 'Shridhar',
            email: 'shridhar_tl@ymail.com',
        };
    }

    createRoom = async () => {
        try {
            const { roomId } = await this.props.createRoom(this.state);
            this.props.navigate(`/poker/${roomId}`);
        } catch (err) {
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
        const { roomName, name, email, scoreType, roomError, nameError, hasError } = this.state;

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
                                    label="Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)" onChange={this.setValue} />
                            </div>
                            <div>
                                <RadioButton value={scoreType} field="scoreType" defaultValue={2}
                                    label="Short Fibonacci (0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100)" onChange={this.setValue} />
                            </div>
                            <div>
                                <RadioButton value={scoreType} field="scoreType" defaultValue={3}
                                    label="T-Shirt (XXS, XS, S, M, L, XL, XXL)" onChange={this.setValue} />
                            </div>

                            <Button label="CREATE ROOM" className="mt-2" disabled={hasError} onClick={this.createRoom} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(CreateRoom, null, { createRoom });