type QueueItem = {
    callback: () => Promise<unknown>;
    promise: Promise<unknown>;
    startTask: () => void;
    completed?: boolean;
};

type EventListener = (...args: unknown[]) => void;

class SimpleEventEmitter {
    private events: Map<string, EventListener[]> = new Map();

    on(event: string, listener: EventListener): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);
    }

    emit(event: string, ...args: unknown[]): void {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach((listener) => listener(...args));
        }
    }

    removeListener(event: string, listener: EventListener): void {
        const listeners = this.events.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
}

export default class QueueService {
    private concurrentRuns = 3;
    private event: SimpleEventEmitter;
    private queue: QueueItem[] = [];
    private runningItems: QueueItem[] = [];

    constructor() {
        this.event = new SimpleEventEmitter();
        this.reset();
    }

    on(event: string, listener: EventListener): void {
        this.event.on(event, listener);
    }

    off(event: string, listener: EventListener): void {
        this.event.removeListener(event, listener);
    }

    reset(): void {
        this.queue = [];
        this.runningItems = [];
    }

    add = (callback: () => Promise<unknown>): Promise<unknown> => {
        const obj: Partial<QueueItem> = { callback };

        obj.promise = new Promise<void>((resolve) => {
            obj.startTask = resolve;
        }).then(callback);

        this.queue.push(obj as QueueItem);

        return obj.promise;
    };

    addRange(array?: (() => Promise<unknown>)[]): Promise<unknown>[] | undefined {
        if (!array) {
            return;
        }

        if (Array.isArray(array) && array.length) {
            return array.map(this.add);
        }
    }

    start(): void {
        this.processNextItem();
    }

    private processNextItem(): void {
        while (this.queue.length && this.runningItems.filter((r) => !r.completed).length < this.concurrentRuns) {
            const [running] = this.queue.splice(0, 1);
            this.runningItems.push(running);

            running.startTask();

            running.promise
                .catch(() => undefined)
                .finally(() => {
                    running.completed = true;
                    this.clearCompletedItems();
                    this.processNextItem();
                });
        }

        if (this.queue.length === 0 && this.runningItems.length === 0) {
            this.event.emit('completed');
        }
    }

    private clearCompletedItems(): void {
        while (this.runningItems.length && this.runningItems[0].completed) {
            this.runningItems.splice(0, 1);
        }
    }
}
