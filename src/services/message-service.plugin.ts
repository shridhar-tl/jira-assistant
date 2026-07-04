import { showFlag } from '@forge/bridge';

type FlagAppearance = 'success' | 'info' | 'warning' | 'error';

export default class MessageService {
    idNum = 0;
    lastErrorTime = 0;

    onNewMessage(): void {}

    show(description: string, title?: string, type?: string): void {
        if (!description) {
            return;
        }

        showFlag({
            id: `ja-msg_${++this.idNum}`,
            title: title || 'Jira Assistant',
            appearance: type as FlagAppearance,
            description,
            actions: [],
            isAutoDismiss: true,
        });
    }

    success(message: string, title?: string): void {
        this.show(message, title, 'success');
    }

    info(message: string, title?: string): void {
        this.show(message, title, 'info');
    }

    warning(message: string, title?: string): void {
        this.show(message, title, 'warning');
    }

    error(message: string, title?: string, suspendable?: boolean): void {
        const curErrTime = new Date().getTime();
        if (suspendable && this.lastErrorTime + 500 > curErrTime) {
            return;
        }
        this.lastErrorTime = curErrTime;
        this.show(message, title, 'error');
    }
}
