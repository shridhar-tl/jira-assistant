import { useState } from 'react';

import type { MeetingView } from './types';

interface MeetingDetailsProps {
    eventDetails: MeetingView | null;
}

function cutText(text: string, length: number): string {
    if (!text || text.length <= length) return text;
    return `${text.substring(0, length)}...`;
}

export default function MeetingDetails({ eventDetails }: MeetingDetailsProps) {
    const [showAttendees, setShowAttendees] = useState(false);
    const [showFullDesc, setShowFullDesc] = useState(false);

    if (!eventDetails) return null;

    const descLimit = eventDetails.descrLimit || 350;
    const hasLongDescription = eventDetails.description && eventDetails.description.length > descLimit;

    return (
        <div className="event-details">
            <div className="header">
                <div className="controls" />
                <div className="title">{cutText(eventDetails.summary, 75)}</div>
            </div>
            <div className="body">
                <div className="detail">
                    <div className="title">
                        <i className="fa fa-clock" />
                    </div>
                    <div className="info">
                        <span>{eventDetails.date}</span>
                        <span className="info">
                            {eventDetails.startTime} - {eventDetails.endTime} {eventDetails.remaining}
                        </span>
                    </div>
                </div>

                {eventDetails.location && (
                    <div className="detail">
                        <div className="title">
                            <i className="fa fa-map-marker" />
                        </div>
                        <div className="info">{eventDetails.location}</div>
                    </div>
                )}

                {eventDetails.videoCall && (
                    <div className="detail">
                        <div className="title">
                            <i className="fa fa-video-camera" />
                        </div>
                        <div className="info">
                            <a href={eventDetails.videoCall.url} target="_blank" rel="noopener noreferrer">
                                Join meeting: {eventDetails.videoCall.name}
                            </a>
                        </div>
                    </div>
                )}

                {eventDetails.attendees && (
                    <div className="detail pointer">
                        <div className="title">
                            <i className="fa fa-users" />
                        </div>
                        <div className="info" onClick={() => setShowAttendees(!showAttendees)}>
                            <div className="icon float-end">
                                <i className={`fa ${showAttendees ? 'fa-angle-up' : 'fa-angle-down'}`} />
                            </div>
                            <div>
                                <span>{eventDetails.attendees.total} guests</span>
                                <span className="info">
                                    {eventDetails.attendees.yes > 0 && <span>{eventDetails.attendees.yes} yes,</span>}
                                    {eventDetails.attendees.no > 0 && <span>{eventDetails.attendees.no} no,</span>}
                                    {eventDetails.attendees.tentative > 0 && <span> {eventDetails.attendees.tentative} tentative,</span>}
                                    {eventDetails.attendees.awaiting > 0 && <span> {eventDetails.attendees.awaiting} awaiting</span>}
                                </span>
                            </div>
                        </div>
                        {showAttendees && eventDetails.attendees.list && (
                            <div className="attendees">
                                {eventDetails.attendees.list.map((attendee, i) => (
                                    <div key={i} className="attendee">
                                        {attendee.displayName && <span className="name"> {attendee.displayName}</span>}
                                        {attendee.email && <span className="email"> ({attendee.email})</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {eventDetails.description && (
                    <div className="detail">
                        <div className="title">
                            <i className="fa fa-align-justify" />
                        </div>
                        <div
                            className="info"
                            dangerouslySetInnerHTML={{
                                __html: showFullDesc ? eventDetails.description : cutText(eventDetails.description, descLimit),
                            }}
                        />
                        {hasLongDescription && (
                            <div style={{ textAlign: 'center' }}>
                                <span className="link cursor-pointer" onClick={() => setShowFullDesc(!showFullDesc)}>
                                    {showFullDesc ? 'show less' : 'show all'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
