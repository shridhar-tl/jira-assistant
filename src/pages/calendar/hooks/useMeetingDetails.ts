import { useCallback, useState } from 'react';

import { useService } from '@/services/injector';

import type { Meeting } from '@types';

import type { MeetingView } from '../types';

export function useMeetingDetails() {
    const [showMeetingDetails, setShowMeetingDetails] = useState(false);
    const [currentMeetingItem, setCurrentMeetingItem] = useState<MeetingView | null>(null);
    const { $userutils } = useService('UserUtilsService');

    const showMeetingDetailsPopup = useCallback(
        (meeting: Meeting) => {
            const source = meeting.source || 'outlook';
            let meetingView: MeetingView;

            if (source === 'google') {
                meetingView = {
                    summary: meeting.summary || '',
                    htmlLink: meeting.htmlLink,
                    location: typeof meeting.location === 'string' ? meeting.location : meeting.location?.displayName,
                    description: meeting.description,
                    descrLimit: 350,
                    date: $userutils.formatDate(meeting.start?.dateTime || new Date()),
                    startTime: $userutils.formatTime(meeting.start?.dateTime || new Date()),
                    endTime: meeting.end?.dateTime ? $userutils.formatTime(meeting.end.dateTime) : undefined,
                    organizer: meeting.organizer?.displayName,
                };

                if (meeting.attendees) {
                    meetingView.attendees = {
                        total: meeting.attendees.length,
                        yes: meeting.attendees.filter((a: any) => a.responseStatus === 'accepted').length,
                        no: meeting.attendees.filter((a: any) => a.responseStatus === 'notAccepted').length,
                        awaiting: meeting.attendees.filter((a: any) => a.responseStatus === 'needsAction').length,
                        tentative: meeting.attendees.filter((a: any) => a.responseStatus === 'tentative').length,
                        list: meeting.attendees.map((a: any) => ({
                            email: a.email,
                            displayName: a.displayName,
                        })),
                    };
                }

                if (meeting.hangoutLink) {
                    let name = meeting.hangoutLink;
                    if (name.lastIndexOf('/') > 0) {
                        name = name.substring(name.lastIndexOf('/') + 1);
                    }
                    meetingView.videoCall = { url: meeting.hangoutLink, name };
                }
            } else {
                meetingView = {
                    summary: meeting.subject || '',
                    htmlLink: meeting.webLink,
                    location: typeof meeting.location === 'string' ? meeting.location : meeting.location?.displayName,
                    description: meeting.bodyPreview,
                    descrLimit: 350,
                    date: $userutils.formatDate(meeting.start?.dateTime || new Date()),
                    startTime: $userutils.formatTime(meeting.start?.dateTime || new Date()),
                    endTime: meeting.end?.dateTime ? $userutils.formatTime(meeting.end.dateTime) : undefined,
                    organizer: meeting.organizer?.emailAddress?.name,
                };

                if (meeting.attendees) {
                    meetingView.attendees = {
                        total: meeting.attendees.length,
                        yes: meeting.attendees.filter((a: any) => a.status?.response === 'accepted').length,
                        no: meeting.attendees.filter((a: any) => a.status?.response === 'notAccepted').length,
                        awaiting: meeting.attendees.filter((a: any) => a.status?.response === 'needsAction').length,
                        tentative: meeting.attendees.filter((a: any) => a.status?.response === 'tentative').length,
                        list: meeting.attendees.map((a: any) => ({
                            email: a.emailAddress?.address,
                            displayName: a.emailAddress?.name,
                        })),
                    };
                }

                if (meeting.onlineMeetingUrl) {
                    let name = meeting.onlineMeetingUrl;
                    if (name.lastIndexOf('/') > 0) {
                        name = name.substring(name.lastIndexOf('/') + 1);
                    }
                    meetingView.videoCall = { url: meeting.onlineMeetingUrl, name };
                }
            }

            setCurrentMeetingItem(meetingView);
            setShowMeetingDetails(true);
        },
        [$userutils],
    );

    const hideMeetingDetails = useCallback(() => {
        setShowMeetingDetails(false);
    }, []);

    return {
        showMeetingDetails,
        currentMeetingItem,
        showMeetingDetailsPopup,
        hideMeetingDetails,
    };
}
