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
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
};

class LazyPromise<T> {
  // private result: T | LazyPromise<T> | Error | null = null;
  // private state = STATE.PENDING;
  private loading = false;

  private onFulfilled: OnFulfilledHandler<T> | null = null;
  private onRejected: OnRejectedHandler | null = null;

  private resolveCallback: (result: T) => LazyPromise<T> | void = () => {};
  private rejectCallback: (e: Error) => void = () => {};

  constructor(handler: LazyPromiseHandler<T>) {
    try {
      handler(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e as Error);
    }
  }

  static all<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {
      const results: T[] = [];
      let count = 0;

      for (let i = 0; i < iterable.length; i += 1) {
        const promise = iterable[i];
        promise
          .then((result: T): any => {
            console.log(result);
            results[i] = result;
            count += 1;

            if (count == iterable.length) {
              resolve(results);
            }
          })
          .catch(reject);
      }
    });
  }

  static allSync<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {
      const results: T[] = [];

      (async () => {
        try {
          for await (let result of iterable) {
            results.push(result);
          }
          resolve(results);
        } catch (e) {
          reject(e as Error);
        }
      })();
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

  _resolve(result: T | LazyPromise<T>) {
    /* if (this.state !== STATE.PENDING) {
      return;
    }

    this.state = STATE.FULFILLED;
    this.result = result; */

    if (this.loading) {
      return;
    }

    this.loading = true;

    queueMicrotask(async () => {
      if (!this.onFulfilled) {
        return;
      }

      try {
        const value = this.onFulfilled(result as T);

        if (value instanceof LazyPromise) {
          value.then(this.resolveCallback as any);
        } else {
          this.resolveCallback(value);
        }
      } catch (e) {
        this.rejectCallback(e as Error);
      }
    });
  }

  _reject(e: Error) {
    /* if (this.state !== STATE.PENDING) {
      return;
    }

    this.state = STATE.REJECTED;
    this.result = e; */

    if (this.loading) {
      return;
    }

    this.loading = true;

    queueMicrotask(() => {
      if (!this.onRejected) {
        this.rejectCallback(e);
        return;
      }
      this.onRejected(e as Error);
    });
  }

  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T> {
    if (this.onFulfilled || this.onRejected) {
      throw new Error('then() or catch() could not be called more than once');
    }

    this.onFulfilled = onFulfilled;

    return new LazyPromise((resolve, reject) => {
      this.resolveCallback = resolve;
      this.rejectCallback = reject;
    });
  }

  catch(onRejected: OnRejectedHandler): void {
    if (this.onFulfilled || this.onRejected) {
      throw new Error('then() or catch() could not be called more than once');
    }

    this.onRejected = onRejected;

    new LazyPromise((_, reject) => {
      this.rejectCallback = reject;
    });
  }
}

LazyPromise.all([
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(1);
    }, 3000);
  }),
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, 2000);
  }),
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(3);
    }, 1000);
  }),
]).then((res: any) => {
  console.log(res);
  return res;
});

/* LazyPromise.allSync([
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(1);
    }, 3000);
  }),
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, 2000);
  }),
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(3);
    }, 1000);
  }),
]).then((res: any) => {
  console.log(res);
  return res;
}); */

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

/* LazyPromise.resolve<any>(1)
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
  }); */
