interface ScheduleOptions {
    recursive?: boolean;
}

class Schedule {
    private cToken?: ReturnType<typeof setTimeout>;
    private cancelled: () => void;
    private options: ScheduleOptions;

    constructor(id: string, time: Date | number, callback: () => void, cancelled: () => void, options: ScheduleOptions) {
        this.cancelled = cancelled;
        this.options = options;

        let waitTime: number | null = null;
        if (time instanceof Date) {
            waitTime = time.getTime() - new Date().getTime();
        } else if (typeof time === 'number') {
            waitTime = time * 60 * 1000;
        }

        if (waitTime !== null && waitTime >= 0) {
            if (options.recursive) {
                this.cToken = setInterval(callback, waitTime);
            } else {
                this.cToken = setTimeout(() => {
                    cancelled();
                    callback();
                }, waitTime);
            }
        }
    }

    cancel(): void {
        if (this.cToken) {
            if (this.options.recursive) {
                clearInterval(this.cToken);
            } else {
                clearTimeout(this.cToken);
            }
            this.cancelled();
        }
    }
}

class Scheduler {
    private schedules: Record<string, Schedule> = {};

    create(id: string, time: Date | number, callback: (schedule: Schedule) => void, options: ScheduleOptions = {}): Schedule {
        let sch = this.schedules[id];
        if (sch) {
            sch.cancel();
        }

        sch = new Schedule(
            id,
            time,
            () => callback(sch),
            () => delete this.schedules[id],
            options,
        );
        this.schedules[id] = sch;
        return sch;
    }
}

export const scheduler = new Scheduler();
