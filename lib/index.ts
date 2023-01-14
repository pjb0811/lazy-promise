type LazyPromiseHandler<T> = (
  resolve: (result: T | LazyPromise<T>) => void,
  reject: (reason: Error) => void,
) => void;
type OnFulfilledHandler<T> = (result: T) => LazyPromise<T>;
type OnRejectedHandler = (reason: Error) => void;
/* 
interface LazyPromise<T> {
  new (handler: LazyPromiseHandler<T>): LazyPromise<T>;
  static all(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
  static allSync(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
  static resolve(result: T): LazyPromise<T>;
  static reject(reason: Error): LazyPromise<T>;
  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T>;
  catch(onRejected: OnRejectedHandler): void;
} */

const STATE: { [key: string]: string } = {
  FULFILLED: 'fulfilled',
  PENDING: 'pending',
  REJECTED: 'rejected',
};
class LazyPromise<T> {
  private result: T | LazyPromise<T> | Error | null = null;
  private state = STATE.PENDING;

  private onFulfilled: OnFulfilledHandler<T> | null = null;
  private onRejected: OnRejectedHandler | null = null;

  private resolveCallback: OnFulfilledHandler<T> = result =>
    LazyPromise.resolve(result);
  private rejectCallback: OnRejectedHandler = e => {
    throw e;
  };

  constructor(handler: LazyPromiseHandler<T>) {
    try {
      handler(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e as Error);
    }
  }

  static all<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {});
  }

  static allSync<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {});
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

  _resolve(result: T | LazyPromise<T>) {
    if (this.state !== STATE.PENDING) {
      return;
    }

    this.state = STATE.FULFILLED;
    this.result = result;

    queueMicrotask(async () => {
      if (!this.onFulfilled) {
        return;
      }

      try {
        const value = this.onFulfilled(result as T);

        if (value instanceof LazyPromise) {
          value.then(this.resolveCallback);
        } else {
          this.resolveCallback(value);
        }
      } catch (e) {
        this.rejectCallback(e as Error);
      }
    });
  }

  _reject(e: Error) {
    if (this.state !== STATE.PENDING) {
      return;
    }

    this.state == STATE.REJECTED;

    queueMicrotask(() => {
      if (!this.onRejected) {
        return;
      }
      this.onRejected(e as Error);
    });
  }

  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T> {
    if (this.result && (this.onFulfilled || this.onRejected)) {
      throw new Error('then() or catch() could not be called more than once');
    }

    this.onFulfilled = onFulfilled;

    return new LazyPromise((resolve, reject) => {
      this.resolveCallback = result => {
        resolve(result);
        return this;
      };
      this.rejectCallback = reject;
    });
  }

  catch(onRejected: OnRejectedHandler): void {
    if (this.result && (this.onFulfilled || this.onRejected)) {
      throw new Error('then() or catch() could not be called more than once');
    }

    this.onRejected = onRejected;

    new LazyPromise((_, reject) => {
      this.rejectCallback = reject;
    });
  }
}

/* const promise = LazyPromise.resolve(1);
promise
  .then((res: any) => {
    console.log('start', res);
    return res + 2;
  })
  .then((res: any) => {
    console.log('end', res);
    return res + 3;
  })
  .catch(err => {
    console.log(err);
  }); */

LazyPromise.resolve<any>(1)
  .then(res => {
    console.log('start', res);
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 1), 1000);
    });
  })
  .then(res => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 1), 1000);
    });
  })
  .then(res => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 1), 1000);
    });
  })
  .then(res => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 1), 1000);
    });
  })
  .then(res => {
    console.log('finish', res);
    return res;
  })
  .catch(err => {
    console.log('error', err);
  });

/* 
// then() or catch() could not be called more than once
const promise = LazyPromise.resolve(3);
promise.then((res) => res + 1);
promise.then((res) => res + 10); // it should throw an error!
promise.catch((err) => {}); // it should also throw an error!
// method chaining is still valid though
// the following code prints out 14 (3+1+10)
LazyPromise.resolve(3)
  .then((res) => res + 1)
  .then((res) => {
    return new LazyPromise((resolve) => {
    setTimeout(() => resolve(res + 10), 10);
    });
  })
  .then((res) => console.log(res))
  .catch((err) => {});
*/
