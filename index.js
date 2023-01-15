const STATE = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
};
class LazyPromise {
    constructor(handler) {
        this.state = STATE.PENDING;
        this.result = null;
        this.onFulfilled = null;
        this.onRejected = null;
        this.queue = [];
        try {
            handler(this._resolve.bind(this), this._reject.bind(this));
        }
        catch (e) {
            this._reject(e);
        }
    }
    then(onFulfilled) {
        if (this.onFulfilled || this.onRejected) {
            throw new Error('then() or catch() could not be called more than once');
        }
        this.onFulfilled = onFulfilled;
        if (this.state === STATE.PENDING) {
            return new LazyPromise(resolve => {
                this.queue.push(() => resolve(onFulfilled(this.result)));
            });
        }
        if (this.state === STATE.FULFILLED) {
            return new LazyPromise(resolve => resolve(onFulfilled(this.result)));
        }
        return this;
    }
    catch(onRejected) {
        if (this.onFulfilled || this.onRejected) {
            throw new Error('then() or catch() could not be called more than once');
        }
        this.onRejected = onRejected;
        if (this.state === STATE.PENDING) {
            new LazyPromise(resolve => {
                this.queue.push(() => resolve(onRejected(this.result)));
            });
        }
        if (this.state === STATE.REJECTED) {
            new LazyPromise(resolve => resolve(onRejected(this.result)));
        }
    }
    _resolve(result) {
        if (this.state !== STATE.PENDING) {
            return;
        }
        try {
            if (result instanceof LazyPromise) {
                result.then((innerResult) => {
                    this.state = STATE.FULFILLED;
                    this.result = innerResult;
                    this.queue.forEach(resolve => resolve());
                });
            }
            else {
                this.state = STATE.FULFILLED;
                this.result = result;
                this.queue.forEach(resolve => resolve());
            }
        }
        catch (e) {
            this.state = STATE.REJECTED;
            this.result = e;
            this.queue.forEach(reject => reject());
        }
    }
    _reject(reason) {
        if (this.state !== STATE.PENDING) {
            return;
        }
        this.state = STATE.REJECTED;
        this.result = reason;
        this.queue.forEach(reject => reject());
    }
    static all(iterable) {
        return new LazyPromise((resolve, reject) => {
            const results = [];
            let count = 0;
            try {
                for (let i = 0; i < iterable.length; i += 1) {
                    const promise = iterable[i];
                    promise.then(result => {
                        results[i] = result;
                        count += 1;
                        if (count === iterable.length) {
                            resolve(results);
                        }
                        return promise;
                    });
                }
            }
            catch (e) {
                reject(e);
            }
        });
    }
    static allSync(iterable) {
        return new LazyPromise((resolve, reject) => {
            const results = [];
            const syncPromise = (i) => {
                try {
                    const promise = iterable[i];
                    promise.then((result) => {
                        results.push(result);
                        if (i === iterable.length - 1) {
                            resolve(results);
                        }
                        else {
                            syncPromise(i + 1);
                        }
                        return promise;
                    });
                }
                catch (e) {
                    reject(e);
                }
            };
            syncPromise(0);
        });
    }
    static resolve(result) {
        if (result instanceof LazyPromise) {
            return result;
        }
        return new LazyPromise(resolve => resolve(result));
    }
    static reject(reason) {
        return new LazyPromise((_, reject) => reject(reason));
    }
}
export default LazyPromise;
