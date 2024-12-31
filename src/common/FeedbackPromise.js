class FeedbackPromise extends Promise {
    constructor(executor) {
        const progressHandlers = [];

        super((resolve, reject) => {
            const progress = (value) => {
                progressHandlers.forEach(handler => {
                    try {
                        handler(value);
                    } catch (err) {
                        console.error(err);
                    }
                });
            };

            try {
                const result = executor(resolve, reject, progress);
                if (typeof result?.then === 'function') {
                    result.then(resolve, reject);
                }
            } catch (err) {
                reject(err);
            }
        });

        this._progressHandlers = progressHandlers;
    }

    progress(handler) {
        if (typeof handler === 'function') {
            this._progressHandlers.push(handler);
        }
        return this;
    }

    then(onFulfilled, onRejected) {
        const newPromise = super.then(onFulfilled, onRejected);
        newPromise._progressHandlers = this._progressHandlers.slice();
        newPromise.progress = this.progress.bind(newPromise);
        return newPromise;
    }

    catch(onRejected) {
        const newPromise = super.catch(onRejected);
        newPromise._progressHandlers = this._progressHandlers.slice();
        newPromise.progress = this.progress.bind(newPromise);
        return newPromise;
    }

    finally(onFinally) {
        const newPromise = super.finally(onFinally);
        newPromise._progressHandlers = this._progressHandlers.slice();
        newPromise.progress = this.progress.bind(newPromise);
        return newPromise;
    }
}

export default FeedbackPromise;
