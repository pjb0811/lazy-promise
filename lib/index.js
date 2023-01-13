/* 
type LazyPromiseHandler<T> = (
  resolve: (result | LazyPromise<T>) => void,
  reject: (reason: Error) => void,
) => void;
type OnFulfilledHandler<T> = (result: T) => LazyPromise<T>;
type OnRejectedHandler = (reason: Error) => void;

interface LazyPromise<T> {
  new (handler: LazyPromiseHandler<T>): LazyPromise<T>;
  static all(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
  static allSync(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
  static resolve(result: T): LazyPromise<T>;
  static reject(reason: Error): LazyPromise<T>;
  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T>;
  catch(onRejected: OnRejectedHandler): void;
}
*/

class LazyPromise {
  _handler;
  _onFulfilled;
  _onRejected;

  constructor(handler) {
    this._handler = handler;
  }

  /* static all(iterable) {
    return new LazyPromise((resolve, reject) => {});
  }

  static allSync(iterable) {} */

  static resolve(result) {
    return new LazyPromise(resolve => resolve(result));
  }

  static reject(reason) {
    return new LazyPromise((resolve, reject) => reject(reason));
  }

  then(onFulfilled) {
    /* if (this._onFulfilled || this._onRejected) {
      throw new Error('then() or catch() could not be called more than once');
    } */
    this._onFulfilled = onFulfilled;
    this.run();
    return this;
  }

  catch(onRejected) {
    /* if (this._onFulfilled || this._onRejected) {
      throw new Error('then() or catch() could not be called more than once');
    } */
    this._onRejected = onRejected;
    this.run();
  }

  run() {
    this._handler(
      result => {
        if (result instanceof LazyPromise) {
          result.then(innerResult => {
            this._onFulfilled && this._onFulfilled(innerResult);
            return this;
          });
        } else {
          this._onFulfilled && this._onFulfilled(result);
        }
      },
      reason => {
        this._onRejected && this._onRejected(reason);
      },
    );
  }
}

// const promise = LazyPromise.resolve(3);
// promise.then(res => res + 1);
// promise.then(res => res + 10); // it should throw an error!
// promise.catch(err => {}); // it should also throw an error!

LazyPromise.resolve(3)
  .then(res => res + 1)
  /* .then(res => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 10), 100);
    });
  }) */
  .then(res => console.log('then', res))
  .catch(err => {
    console.log('error', err);
  });
