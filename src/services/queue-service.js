import { EventEmitter } from "events";

export default class QueueService {
    constructor() {
        this.continueOnFailure = true;
        this.concurrentRuns = 3;
        this.event = new EventEmitter();
        this.reset();
    }

    on(event, listener) {
        this.event.on(event, listener);
    }

    reset() {
        this.queue = [];
        this.failedItems = [];
        this.runningItems = [];
    }

    add = (callback) => {
        const obj = { callback };

        obj.promise = new Promise((success) => {
            obj.startTask = success;
        }).then(callback);

        this.queue.push(obj);

        return obj.promise;
    }

    addRange(array) {
        if (!array) { return; }

        if (Array.isArray(array) && array.length) {
            return array.map(this.add);
        }
    }

    start() {
        this.processNextItem();
    }

    processNextItem() {
        if (this.queue.length && (this.runningItems.length < this.concurrentRuns || this.runningItems.count(r => !r.completed) < this.concurrentRuns)) {
            const [running] = this.queue.splice(0, 1);
            this.runningItems.push(running);

            const { startTask, promise } = running;

            startTask();

            promise.finally(() => {
                running.completed = true;
                this.clearCompletedItems();
                this.processNextItem();
            });
        }
        else if (this.queue.length === 0 && this.runningItems.length === 0) {
            this.event.emit("completed");
        }
    }

    clearCompletedItems() {
        while (this.runningItems.length && this.runningItems[0].completed) {
            this.runningItems.splice(0, 1);
        }
    }
}