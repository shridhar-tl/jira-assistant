export default class MessageService {
    constructor() {
        this.handler = (msgObj) => { console.log(msgObj); };
    }

    onNewMessage(callback) {
        this.handler = callback;
    }

    warning(message, title) {
        const msg = { life: 5000, summary: title, detail: message, severity: "warn" };
        this.handler(msg);
    }
    error(message, title, suspendable) {
        const curErrTime = new Date().getTime();
        if (suspendable && this.lastErrorTime + 500 > curErrTime) {
            return;
        }
        this.lastErrorTime = curErrTime;
        const msg = { life: 6000, summary: title, detail: message, severity: "error" };
        this.handler(msg);
    }
    success(message, title) {
        const msg = { life: 4000, summary: title, detail: message, severity: "success" };
        this.handler(msg);
    }
    info(message, title) {
        const msg = { life: 5000, summary: title, detail: message, severity: "info" };
        this.handler(msg);
    }
}
