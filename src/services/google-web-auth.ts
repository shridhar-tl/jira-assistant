const googleWebClientId = '692513716183-jm587gc534dvsere4qhnk5bj68pql3p9.apps.googleusercontent.com';
const googleCalendarScopes = ['https://www.googleapis.com/auth/calendar.readonly'];

export function getGoogleCalendarAuthUrl(redirectUrl: string): string {
    const params = new URLSearchParams({
        client_id: googleWebClientId,
        response_type: 'token',
        redirect_uri: redirectUrl,
        scope: googleCalendarScopes.join(' '),
    });
    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
}

export function extractAccessToken(redirectUri: string): string | null {
    const m = redirectUri.match(/[#?](.*)/);
    if (!m || m.length < 1) {
        return null;
    }
    const params = new URLSearchParams(m[1].split('#')[0]);
    return params.get('access_token');
}
