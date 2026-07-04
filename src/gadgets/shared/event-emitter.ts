/**
 * Simple event emitter for dashboard-level events
 */
export class EventEmitter {
    private events: Map<string, Function[]> = new Map();

    on(event: string, handler: Function) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(handler);
    }

    emit(event: string, ...args: any[]) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach((handler) => handler(...args));
        }
    }

    removeListener(event: string, handler: Function) {
        const handlers = this.events.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
}

export const dashboardEventEmitter = new EventEmitter();
