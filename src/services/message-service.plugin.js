import { showFlag } from '@forge/bridge';

export default class MessageService {
    idNum = 0;
    onNewMessage() { /* */ }

    show(description, title, type) {
        if (!description) { return; }

        return showFlag({
            id: `ja-msg_${++this.idNum}`,
            title: title || 'Jira Assistant',
            type,
            description,
            actions: [],
            isAutoDismiss: true,
        });
    }

    success(message, title) { this.show(message, title, "success", 4000); }

    info(message, title) { this.show(message, title, "info"); }

    warning(message, title) { this.show(message, title, "warn"); }

    error(message, title, suspendable) {
        const curErrTime = new Date().getTime();
        if (suspendable && this.lastErrorTime + 500 > curErrTime) {
            return;
        }
        this.lastErrorTime = curErrTime;
        this.show(message, title, "error", 6000);
    }
}
