import { pokerTokenExchangeUrl } from "../../constants/oauth";
import { inject } from "../../services/injector-service";

export function storeAuthInfo(roomInfo) {
    const { sid, roomId } = roomInfo;
    localStorage.setItem('PRI', roomId);
    localStorage.setItem('SID', sid);
    //localStorage.setItem('PTK', token);
    //localStorage.setItem('PEX', new Date().getTime() + (52 * 60 * 1000));
}

export function clearAuthInfo() {
    localStorage.removeItem('PRI');
    localStorage.removeItem('SID');
    localStorage.removeItem('PTK');
    localStorage.removeItem('PEX');
}

export async function loadAuthInfo(roomId) {
    const data = {
        roomId: localStorage.getItem('PRI'),
        sid: localStorage.getItem('SID'),
        //token: localStorage.getItem('PTK'),
    };

    if (data.roomId !== roomId) { return; }
    /*
        const exp = parseInt(localStorage.getItem('PRI'));
        if (exp < new Date().getTime()) {
            console.error('Session expired. Unable to connect back');
            // ToDo: Get new token and assign it to data.token
            //storeAuthInfo(data);
        }*/

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