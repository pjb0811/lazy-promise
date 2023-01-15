type LazyPromiseHandler<T> = (
  resolve: (result: T | LazyPromise<T>) => void,
  reject: (reason: Error) => void,
) => void;
type OnFulfilledHandler<T> = (result: T) => LazyPromise<T>;
type OnRejectedHandler = (reason: Error) => void;

interface LazyPromise<T> {
  new (handler: LazyPromiseHandler<T>): LazyPromise<T>;
  all(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
  allSync(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
  resolve(result: T): LazyPromise<T>;
  reject(reason: Error): LazyPromise<T>;
  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T>;
  catch(onRejected: OnRejectedHandler): void;
}

const STATE: { [key: string]: string } = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
};

class LazyPromise<T> {
  private state = STATE.PENDING;
  private result: T | LazyPromise<T> | Error | null = null;

  private onFulfilled: OnFulfilledHandler<T> | null = null;
  private onRejected: OnRejectedHandler | null = null;

  queue: (() => void)[] = [];

  constructor(handler: LazyPromiseHandler<T>) {
    try {
      handler(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e as Error);
    }
  }

  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T> {
    if (this.onFulfilled || this.onRejected) {
      throw new Error('then() or catch() could not be called more than once');
    }

    this.onFulfilled = onFulfilled;

    if (this.state === STATE.PENDING) {
      return new LazyPromise(resolve => {
        this.queue.push(() => resolve(onFulfilled(this.result as T)));
      });
    }

    if (this.state === STATE.FULFILLED) {
      return new LazyPromise(resolve => resolve(onFulfilled(this.result as T)));
    }

    return this;
  }

  catch(onRejected: OnRejectedHandler) {
    if (this.onFulfilled || this.onRejected) {
      throw new Error('then() or catch() could not be called more than once');
    }

    this.onRejected = onRejected;

    if (this.state === STATE.PENDING) {
      new LazyPromise(resolve => {
        this.queue.push(() => resolve(onRejected(this.result as Error)));
      });
    }

    if (this.state === STATE.REJECTED) {
      new LazyPromise(resolve => resolve(onRejected(this.result as Error)));
    }
  }

  _resolve(result: T | LazyPromise<T>) {
    if (this.state !== STATE.PENDING) {
      return;
    }

    try {
      if (result instanceof LazyPromise) {
        result.then((innerResult: T): any => {
          this.state = STATE.FULFILLED;
          this.result = innerResult;
          this.queue.forEach(resolve => setTimeout(resolve, 0));
        });
      } else {
        this.state = STATE.FULFILLED;
        this.result = result;
        this.queue.forEach(resolve => setTimeout(resolve, 0));
      }
    } catch (e) {
      this.state = STATE.REJECTED;
      this.result = e as Error;
      this.queue.forEach(reject => setTimeout(reject, 0));
    }
  }

  _reject(reason: Error) {
    if (this.state !== STATE.PENDING) {
      return;
    }

    this.state = STATE.REJECTED;
    this.result = reason;

    this.queue.forEach(reject => setTimeout(reject, 0));
  }

  static all<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {
      const results: T[] = [];
      let count = 0;

      for (let i = 0; i < iterable.length; i += 1) {
        const promise = iterable[i];
        promise
          .then((result: T) => {
            results[i] = result;
            count += 1;

            if (count == iterable.length) {
              resolve(results);
            }
            return promise;
          })
          .catch(reject);
      }
    });
  }

  static allSync<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {
      const results: T[] = [];
      const syncPromise = (i: number) => {
        try {
          iterable[i].then((result: T): any => {
            results.push(result);

            if (i === iterable.length - 1) {
              resolve(results);
            } else {
              syncPromise(i + 1);
            }
          });
        } catch (e) {
          reject(e as Error);
        }
      };
      syncPromise(0);
    });
  }

  static resolve<T>(result: T): LazyPromise<T> {
    if (result instanceof LazyPromise) {
      return result;
    }
    return new LazyPromise(resolve => resolve(result));
  }

  static reject<T>(reason: Error): LazyPromise<T> {
    return new LazyPromise((_, reject) => reject(reason));
  }
}

export default LazyPromise;
