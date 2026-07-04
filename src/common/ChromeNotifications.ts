interface NotificationButton {
    onClick?: () => void;
}

interface NotificationOptions {
    id?: string;
    buttons?: NotificationButton[];
    onClicked?: (byUser: boolean) => void;
    onClosed?: (byUser: boolean) => void;
    others?: Record<string, any>;
}

interface ChromeAPI {
    notifications: {
        onButtonClicked: {
            addListener: (callback: (id: string, index: number) => void) => void;
        };
        onClicked: {
            addListener: (callback: (id: string, byUser: boolean) => void) => void;
        };
        onClosed: {
            addListener: (callback: (id: string, byUser: boolean) => void) => void;
        };
        create: (idOrOptions: string | any, optionsOrCallback?: any, callback?: (notId: string) => void) => void;
        clear: (id: string) => void;
    };
}

export class Notifications {
    private chrome: ChromeAPI;
    private curShowing: Record<string, NotificationOptions> = {};

    constructor(chrome: ChromeAPI) {
        this.chrome = chrome;

        if (!this.chrome.notifications) {
            return;
        }

        this.chrome.notifications.onButtonClicked.addListener(this.buttonClicked.bind(this));
        this.chrome.notifications.onClicked.addListener(this.onClicked.bind(this));
        this.chrome.notifications.onClosed.addListener(this.onClosed.bind(this));
    }

    private buttonClicked(id: string, index: number): void {
        const noti = this.curShowing[id];
        if (noti) {
            const btn = noti.buttons?.[index];
            if (btn?.onClick) {
                btn.onClick();
            } else {
                alert('This functionality is not yet implemented!');
            }
            this.chrome.notifications.clear(id);
        }
    }

    private onClicked(id: string, byUser: boolean): void {
        const noti = this.curShowing[id];
        if (noti?.onClicked) {
            noti.onClicked(byUser);
        }
    }

    private onClosed(id: string, byUser: boolean): void {
        const noti = this.curShowing[id];
        if (noti) {
            delete this.curShowing[id];
            if (noti.onClosed) {
                noti.onClosed(byUser);
            }
        }
    }

    show(title: string, message: string, ctxMsg?: string, opts: NotificationOptions = {}): void {
        if (!this.chrome.notifications) {
            return;
        }

        const { id, others } = opts;
        const msgObj = {
            type: 'basic',
            iconUrl: '/assets/icon_48.png',
            title,
            message,
            contextMessage: ctxMsg,
            isClickable: true,
            requireInteraction: true,
            ...others,
        };

        const cb = (notId: string) => {
            this.curShowing[id || notId] = opts;
        };

        if (id) {
            this.chrome.notifications.create(id, msgObj, cb);
        } else {
            this.chrome.notifications.create(msgObj, cb);
        }
    }
}
