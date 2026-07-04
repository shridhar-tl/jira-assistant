import { pokerTokenExchangeUrl } from '@/constants/oauth';

import { inject } from '@services';

const ROOM_ID_KEY = 'PRI';
const SID_KEY = 'SID';

export function storeAuthInfo(roomInfo: { sid: string; roomId: string }) {
    const { sid, roomId } = roomInfo;
    localStorage.setItem(ROOM_ID_KEY, roomId);
    localStorage.setItem(SID_KEY, sid);
}

export function clearAuthInfo() {
    localStorage.removeItem(ROOM_ID_KEY);
    localStorage.removeItem(SID_KEY);
}

export async function loadAuthInfo(roomId: string) {
    const data = {
        roomId: localStorage.getItem(ROOM_ID_KEY) || '',
        sid: localStorage.getItem(SID_KEY) || '',
    };

    if (data.roomId !== roomId) {
        return null;
    }

    return data;
}

export async function getAuthDetails(email: string, roomId?: string) {
    let url = pokerTokenExchangeUrl;
    if (roomId) {
        url += `/${roomId}`;
    }

    const svc = inject('AjaxRequestService');
    const { success, message, ...session } = await svc.$request.execute('POST', url, { email }, { withCredentials: false });

    if (!success) {
        throw new Error(message);
    }

    return session;
}
