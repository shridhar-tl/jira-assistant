import React, { PureComponent } from 'react';
import { WorklogContext } from '../../../common/context';
import Link from '../../../controls/Link';
import AddWorklog from '../../../dialogs/AddWorklog';
import { inject } from '../../../services/injector-service';
import './TimerControl.scss';

class TimerControl extends PureComponent {
    static contextType = WorklogContext;

    constructor(props) {
        super(props);
        inject(this, "UserUtilsService");
        this.state = { showEditor: false };
    }

    showEditor = () => this.setState({ showEditor: true });
    hideDialog = () => this.setState({ showEditor: false });

    trackerUpdated = (entry) => {
        this.context.setUpdates(entry);
        this.hideDialog();
    };

    render() {
        const curTime = this.context.getElapsedTimeInSecs();

        if (!curTime) { return null; }

        return (
            <div className="timer-ctl">
                <Link className="ticket-no link" href={this.$userutils.getTicketUrl(curTime.key)}>{curTime.key}</Link>
                <Lapse key={`${curTime.key}_${curTime.isRunning ? 'R' : 'S'}`} isRunning={curTime.isRunning} lapse={curTime.lapse} title={curTime.description} />
                {!curTime.isRunning && <span className="fa fa-play" title="Resume time tracking" onClick={this.context.resumeTimer} />}
                {curTime.isRunning && <span className="fa fa-pause" title="Pause time tracking" onClick={this.context.pauseTimer} />}
                <span className="fa fa-stop" title="Stop time tracking and create worklog entry" onClick={this.context.stopTimer} />
                <span className="fa fa-edit" title="Edit working comment" onClick={this.showEditor} />
                {this.state.showEditor && <AddWorklog editTracker={true} onDone={this.trackerUpdated} onHide={this.hideDialog} />}
            </div>
        );
    }
}

export default TimerControl;

class Lapse extends PureComponent {
    constructor(props) {
        super(props);
        this.state = this.getDisplayTime(props);
    }

    componentDidMount() {
        if (this.props.isRunning) {
            this.token = setInterval(() => this.setState(this.getDisplayTime), 1000);
        }
    }

    getDisplayTime(state) {
        let { lapse } = state;
        lapse = lapse + 1;

        const hours = Math.floor(lapse / 3600);
        const mins = Math.floor((lapse % 3600) / 60);
        const secs = Math.floor(lapse % 60);
        let display;
        if (hours) {
            display = `${hours.pad(2)}:${mins.pad(2)}:${secs.pad(2)}`;
        } else if (mins) {
            display = `${mins.pad(2)}:${secs.pad(2)}`;
        } else {
            display = `${secs.pad(2)}s`;
        }

        return { lapse, display };
    }

    componentWillUnmount() {
        if (this.token) {
            clearInterval(this.token);
        }
    }

    render() {
        return (
            <span className="time-lapsed" title={this.props.title}>{this.state.display}</span>
        );
    }
}