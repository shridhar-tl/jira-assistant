type QueueItem = {
    callback: () => Promise<any>;
    promise: Promise<any>;
    startTask: () => void;
    completed?: boolean;
};

type EventListener = (...args: any[]) => void;

class SimpleEventEmitter {
    private events: Map<string, EventListener[]> = new Map();

    on(event: string, listener: EventListener): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);
    }

    emit(event: string, ...args: any[]): void {
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
    private continueOnFailure = true;
    private concurrentRuns = 3;
    private event: SimpleEventEmitter;
    private queue: QueueItem[] = [];
    private failedItems: QueueItem[] = [];
    private runningItems: QueueItem[] = [];

    constructor() {
        this.event = new SimpleEventEmitter();
        this.reset();
    }

    on(event: string, listener: EventListener): void {
        this.event.on(event, listener);
    }

    reset(): void {
        this.queue = [];
        this.failedItems = [];
        this.runningItems = [];
    }

    add = (callback: () => Promise<any>): Promise<any> => {
        const obj: Partial<QueueItem> = { callback };

        obj.promise = new Promise<void>((resolve) => {
            obj.startTask = resolve;
        }).then(callback);

        this.queue.push(obj as QueueItem);

        return obj.promise;
    };

    addRange(array?: (() => Promise<any>)[]): Promise<any>[] | undefined {
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
        const activeCount = this.runningItems.filter((r: any) => !r.completed).length;

        if (this.queue.length && activeCount < this.concurrentRuns) {
            const [running] = this.queue.splice(0, 1);
            this.runningItems.push(running);

            const { startTask, promise } = running;

            startTask();

            promise.finally(() => {
                running.completed = true;
                this.clearCompletedItems();
                this.processNextItem();
            });
        } else if (this.queue.length === 0 && this.runningItems.length === 0) {
            this.event.emit('completed');
        }
    }

    private clearCompletedItems(): void {
        while (this.runningItems.length && this.runningItems[0].completed) {
            this.runningItems.splice(0, 1);
        }
    }
}
