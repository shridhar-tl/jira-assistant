type ProgressHandler = (value: any) => void;
type PromiseExecutor<T> = (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void,
    progress: (value: any) => void,
) => void | PromiseLike<T | void>;

class FeedbackPromise<T> extends Promise<T> {
    private _progressHandlers: ProgressHandler[];

    constructor(executor: PromiseExecutor<T>) {
        const progressHandlers: ProgressHandler[] = [];

        super((resolve, reject) => {
            const progress = (value: any) => {
                progressHandlers.forEach((handler) => {
                    try {
                        handler(value);
                    } catch (err) {
                        console.error(err);
                    }
                });
            };

            try {
                const result = executor(resolve, reject, progress);
                if (typeof (result as any)?.then === 'function') {
                    (result as PromiseLike<T>).then(resolve, reject);
                }
            } catch (err) {
                reject(err);
            }
        });

        this._progressHandlers = progressHandlers;
    }

    progress(handler: ProgressHandler): this {
        if (typeof handler === 'function') {
            this._progressHandlers.push(handler);
        }
        return this;
    }

    then<TResult1 = T, TResult2 = never>(
        onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): FeedbackPromise<TResult1 | TResult2> {
        const newPromise = super.then(onFulfilled, onRejected) as any;
        newPromise._progressHandlers = this._progressHandlers.slice();
        return newPromise;
    }

    catch<TResult = never>(onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): FeedbackPromise<T | TResult> {
        const newPromise = super.catch(onRejected) as any;
        newPromise._progressHandlers = this._progressHandlers.slice();
        return newPromise;
    }

    finally(onFinally?: (() => void) | null): FeedbackPromise<T> {
        const newPromise = super.finally(onFinally) as any;
        newPromise._progressHandlers = this._progressHandlers.slice();
        return newPromise;
    }
}

export default FeedbackPromise;
