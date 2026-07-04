export const DummyWLId = 9999999;

export const GoogleOAuth = {
    clientId: '496652059877-4c2b965bb7i74rqfbu4khs0s5hklk9i9.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    getAuthUrl: function (redirectUrl: string): string {
        return `https://accounts.google.com/o/oauth2/auth?client_id=${GoogleOAuth.clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${encodeURIComponent(GoogleOAuth.scopes.join(' '))}`;
    },
};

export const AppVersionNo = 3.0;

let AnalyticsTrackingId = 'G-CJQYE6Q1JQ';

if (import.meta.env.MODE !== 'production') {
    AnalyticsTrackingId = 'G-CJQYE6Q1JQ';
}

export { AnalyticsTrackingId };

export const SystemUserId = 1;

export const BuildDateTime =
    import.meta.env.MODE === 'production' && import.meta.env.VITE_BUILD_DATE
        ? new Date(parseInt(import.meta.env.VITE_BUILD_DATE))
        : new Date();

export const DefaultCalendarSettings = {
    showWeekends: true,
    showWeekNumbers: false,
    startOfWeek: 0,
    workingDays: [1, 2, 3, 4, 5],
    startOfDay: '09:00',
    endOfDay: '18:00',
    slotDuration: '00:30:00',
    minTime: '00:00:00',
    maxTime: '24:00:00',
};

export const DefaultUserDayWiseReportSettings = {
    showWeekends: true,
    groupBy: 'date',
    dateFormat: 'DD/MM/YYYY',
};
