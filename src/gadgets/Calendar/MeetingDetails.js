import React, { PureComponent } from 'react';

const desc_len = 350;

class MeetingDetails extends PureComponent {
    state = {};

    toggleShowAttendees = () => this.setState({ showAttendees: !this.state.showAttendees })
    toggleShowDesc = () => this.setState({ showFullDesc: !this.state.showFullDesc })

    render() {
        const {
            props: { cut, eventDetails: currentMeetingItem },
            state: { showAttendees, showFullDesc }
        } = this;

        return (<div className="event-details">
            <div className="header">
                <div className="controls" />
                <div className="title">{cut(currentMeetingItem.summary, 75)}</div>
            </div>
            <div className="body">
                <div className="detail">
                    <div className="title"><i className="fa fa-clock-o" /></div>
                    <div className="info">
                        <span>{currentMeetingItem.date}</span>
                        <span className="info">{currentMeetingItem.startTime} - {currentMeetingItem.endTime} {currentMeetingItem.remaining}</span>
                    </div>
                </div>
                {currentMeetingItem.location && <div className="detail">
                    <div className="title"><i className="fa fa-map-marker" /></div>
                    <div className="info">{currentMeetingItem.location}</div>
                </div>}
                {currentMeetingItem.videoCall && <div className="detail">
                    <div className="title"><i className="fa fa-video-camera" /></div>
                    <div className="info">
                        <a href={currentMeetingItem.videoCall.url} target="_blank" rel="noopener noreferrer">Join Hangouts: {currentMeetingItem.videoCall.name}</a>
                    </div>
                </div>}
                {currentMeetingItem.attendees && <div className="detail pointer">
                    <div className="title"><i className="fa fa-users" /></div>
                    <div className="info" onClick={this.toggleShowAttendees}>
                        <div className="icon pull-right"><i className={`fa ${showAttendees ? 'fa-angle-up' : 'fa-angle-down'}`} /></div>
                        <div>
                            <span>{currentMeetingItem.attendees.total} guests</span>
                            {currentMeetingItem.attendees && <span className="info">
                                {currentMeetingItem.attendees.yes && <font>{currentMeetingItem.attendees.yes} yes,</font>}
                                {currentMeetingItem.attendees.no && <font>{currentMeetingItem.attendees.no} no,</font>}
                                {currentMeetingItem.attendees.tentative && <font> {currentMeetingItem.attendees.tentative} tentative,</font >}
                                {currentMeetingItem.attendees.awaiting && <font> {currentMeetingItem.attendees.awaiting} awaiting</font >}
                            </span>}
                        </div>
                    </div>
                    {showAttendees && currentMeetingItem.attendees && <div className="attendees">
                        {currentMeetingItem.attendees.list.map((attendee, i) => <div key={i} className="attendee" >
                            {attendee.displayName && <span className="name"> {attendee.displayName}</span>}
                            {attendee.email && <span className="email"> ({attendee.email})</span>}
                        </div>)}
                    </div>}
                </div>}
                {currentMeetingItem.description && <div className="detail">
                    <div className="title"><i className="fa fa-align-justify" /></div>
                    <div className="info" dangerouslySetInnerHTML={{ __html: (showFullDesc ? currentMeetingItem.description : cut(currentMeetingItem.description, desc_len)) }} />
                    {currentMeetingItem.description.length > desc_len && <div style={{ textAlign: 'center' }}>
                        <span className="link" onClick={this.toggleShowDesc}>{showFullDesc ? "show less" : "show all"}</span>
                    </div>}
                </div>}
            </div>
        </div>
        );
    }
}

export default MeetingDetails;