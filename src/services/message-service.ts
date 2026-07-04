export type MessageSeverity = 'success' | 'info' | 'warn' | 'error';

export interface MessageOptions {
    life?: number;
    summary?: string;
    detail: string;
    severity: MessageSeverity;
}

type MessageHandler = (message: MessageOptions) => void;

export default class MessageService {
    private handler: MessageHandler = () => {};
    private lastErrorTime: number = 0;

    onNewMessage(callback: MessageHandler): void {
        this.handler = callback;
    }

    show(detail: string, summary?: string, severity: MessageSeverity = 'info', life: number = 5000): void {
        if (!detail) return;

        this.handler({ life, summary, detail, severity });
    }

    success(message: string, title?: string): void {
        this.show(message, title, 'success', 4000);
    }

    info(message: string, title?: string): void {
        this.show(message, title, 'info');
    }

    warning(message: string, title?: string): void {
        this.show(message, title, 'warn');
    }

    error(message: string, title?: string, suspendable: boolean = false): void {
        const curErrTime = new Date().getTime();

        if (suspendable && this.lastErrorTime + 500 > curErrTime) {
            return;
        }

        this.lastErrorTime = curErrTime;
        this.show(message, title, 'error', 6000);
    }
}
