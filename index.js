'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
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
    } catch (e) {
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
    if (result instanceof LazyPromise) {
      result.then(innerResult => {
        this.state = STATE.FULFILLED;
        this.result = innerResult;
        this.queue.forEach(resolve => setTimeout(resolve, 0));
      });
    } else {
      this.state = STATE.FULFILLED;
      this.result = result;
      this.queue.forEach(resolve => setTimeout(resolve, 0));
    }
  }
  _reject(reason) {
    if (this.state !== STATE.PENDING) {
      return;
    }
    this.state = STATE.REJECTED;
    this.result = reason;
    this.queue.forEach(reject => setTimeout(reject, 0));
  }
  static all(iterable) {
    return new LazyPromise((resolve, reject) => {
      const results = [];
      let count = 0;
      for (let i = 0; i < iterable.length; i += 1) {
        const promise = iterable[i];
        promise
          .then(result => {
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
  static allSync(iterable) {
    return new LazyPromise((resolve, reject) => {
      const results = [];
      const syncPromise = i => {
        try {
          iterable[i].then(result => {
            results.push(result);
            if (i === iterable.length - 1) {
              resolve(results);
            } else {
              syncPromise(i + 1);
            }
          });
        } catch (e) {
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

LazyPromise.resolve(1)
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
  .then(err => {
    throw new Error('이 에러는 catch에 잡힙니다.');
  })
  .catch(err => {
    console.log('error', err);
    return err;
  });

exports.default = LazyPromise;
