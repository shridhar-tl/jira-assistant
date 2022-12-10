export class Notifications {
    constructor(chrome) {
        this.chrome = chrome;
        this.curShowing = {};

        if (!this.chrome.notifications) { return; }

        this.chrome.notifications.onButtonClicked.addListener(this.buttonClicked);
        this.chrome.notifications.onClicked.addListener(this.onClicked);
        this.chrome.notifications.onClosed.addListener(this.onClosed);
    }

    buttonClicked(id, index) {
        const noti = this.curShowing[id];
        if (noti) {
            const btn = noti.buttons[index];
            if (btn && btn.onClick) {
                btn.onClick();
            }
            else {
                // eslint-disable-next-line no-alert
                alert("This functionality is not yet implemented!");
            }
            this.chrome.notifications.clear(id);
        }
    }

    onClicked(id, byUser) {
        const noti = this.curShowing[id];
        if (noti) {
            if (noti.onClicked) {
                noti.onClicked(byUser);
            }
        }
    }

    onClosed(id, byUser) {
        const noti = this.curShowing[id];
        if (noti) {
            delete this.curShowing[id];
            if (noti.onClosed) {
                noti.onClosed(byUser);
            }
        }
    }

    show(title, message, ctxMsg, opts) {
        if (!this.chrome.notifications) { return; }

        const { id, others } = opts;
        const msgObj = {
            type: "basic",
            iconUrl: "/assets/icon_48.png",
            title: title,
            message: message,
            contextMessage: ctxMsg,
            isClickable: true,
            requireInteraction: true,
            ...others
        };
        const cb = (notId) => { this.curShowing[id] = opts; };

        if (id) {
            this.chrome.notifications.create(id, msgObj, cb);
        } else {
            this.chrome.notifications.create(msgObj, cb);
        }
    }
}