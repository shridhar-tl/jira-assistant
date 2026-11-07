import { view } from '@forge/bridge';

import { pokerBasePath } from './constants';

export async function applyPokerDeepLink(): Promise<void> {
    if (window.location.hash !== '' && window.location.hash !== '#' && window.location.hash !== '#/') {
        return;
    }

    try {
        const history = await view.createHistory();
        const { pathname, search } = history.location;
        if (pathname === pokerBasePath || pathname.startsWith(`${pokerBasePath}/`)) {
            window.location.replace(`#${pathname}${search ?? ''}`);
        }
    } catch (error) {
        console.error('Poker could not read the shared link path', error);
    }
}
