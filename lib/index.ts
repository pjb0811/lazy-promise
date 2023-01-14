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

  resolveQueue: (() => void)[] = [];

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
        this.resolveQueue.push(() => resolve(onFulfilled(this.result as T)));
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
      return;
    }

    if (this.state === STATE.REJECTED) {
      setTimeout(onRejected, 0);
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
          this.resolveQueue.forEach(resolve => setTimeout(resolve, 0));
        });
      } else {
        this.state = STATE.FULFILLED;
        this.result = result;
        this.resolveQueue.forEach(resolve => setTimeout(resolve, 0));
      }
    } catch (e) {
      this.state = STATE.REJECTED;

      setTimeout(
        this.onRejected
          ? this.onRejected
          : () => {
              throw e;
            },
        0,
      );
    }
  }

  _reject(reason: Error) {
    if (this.state !== STATE.PENDING) {
      return;
    }

    this.state = STATE.REJECTED;
    this.result = reason;

    setTimeout(
      this.onRejected
        ? this.onRejected
        : () => {
            throw this.result;
          },
      0,
    );
  }

  static all<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {
      const results: T[] = [];
      let count = 0;

      for (let i = 0; i < iterable.length; i += 1) {
        const promise = iterable[i];
        promise
          .then((result: T) => {
            console.log(result);
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
      /* (async () => {
        const results: T[] = [];
        try {
          for await (let result of iterable) {
            console.log(result);
            results.push(result);
          }
          resolve(results);
        } catch (e) {
          reject(e as Error);
        }
      })(); */
      /* const results: T[] = [];
      const syncPromise = (i: number) => {
        iterable[i].then((result: T): any => {
          console.log(result, i);
          results.push(result);

          if (i === iterable.length - 1) {
            resolve(results);
          } else {
            syncPromise(i + 1);
          }
        });
      };
      syncPromise(0); */
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

/* 
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
*/

LazyPromise.allSync([
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(1);
    }, 1000);
  }),
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, 1000);
  }),
  new LazyPromise(resolve => {
    setTimeout(() => {
      resolve(3);
    }, 1000);
  }),
]).then((res: any) => {
  console.log('finish', res);
  return res;
});

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
  .then((res: any) => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 1), 1000);
    });
  })
  .then((res: any) => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 1), 1000);
    });
  })
  .then((res: any) => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 1), 1000);
    });
  })
  .then((res: any) => {
    console.log('finish', res);
    return res;
  })
  .catch((err: any) => {
    console.log('error', err);
  }); */
