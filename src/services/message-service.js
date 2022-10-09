export default class MessageService {
    constructor() {
        this.handler = (msgObj) => { console.log(msgObj); };
    }

    onNewMessage(callback) {
        this.handler = callback;
    }

    show(detail, summary, severity, life = 5000) {
        if (!detail) { return; }
        this.handler({ life, summary, detail, severity });
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
