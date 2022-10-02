import { pokerTokenExchangeUrl } from "../../constants/oauth";
import { inject } from "../../services/injector-service";

export function storeAuthInfo(roomInfo) {
    const { sid, roomId } = roomInfo;
    localStorage.setItem('PRI', roomId);
    localStorage.setItem('SID', sid);
}

export function clearAuthInfo() {
    localStorage.removeItem('PRI');
    localStorage.removeItem('SID');
}

export async function loadAuthInfo(roomId) {
    const data = {
        roomId: localStorage.getItem('PRI'),
        sid: localStorage.getItem('SID'),
    };

    if (data.roomId !== roomId) { return; }

    return data;
}

// External
export async function getAuthDetails(email, roomId) {
    let url = pokerTokenExchangeUrl;
    if (roomId) {
        url += `/${roomId}`;
    }

    const { success, message, ...session } = await execute('POST', url, { email });
    //const { success, message, token, sid, roomId } = await signInUser();

    if (!success) {
        throw new Error(message);
    }

    return session;
}

// Service methods
export function execute(method, url, params) {
    const svc = inject({}, 'AjaxRequestService');
    return svc.$request.execute(method, url, params, { withCredentials: false });
}