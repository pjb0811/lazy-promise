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

class LazyPromise<T> {
  private handler: LazyPromiseHandler<T>;
  private result: T | null = null;
  private reason: Error | null = null;
  // private iterable: LazyPromise<T>[] = [];
  private onFulfilled: OnFulfilledHandler<T> | null = null;
  private onRejected: OnRejectedHandler | null = null;

  constructor(handler: LazyPromiseHandler<T>) {
    this.handler = handler;
  }

  static all<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {});
  }

  static allSync<T>(iterable: LazyPromise<T>[]) {
    return new LazyPromise((resolve, reject) => {});
  }

  static resolve<T>(result: T): LazyPromise<T> {
    return new LazyPromise(resolve => resolve(result));
  }

  static reject<T>(reason: Error): LazyPromise<T> {
    return new LazyPromise((_, reject) => reject(reason));
  }

  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T> {
    this.onFulfilled = onFulfilled;
    return this.execute();
  }

  catch(onRejected: OnRejectedHandler): void {
    this.onRejected = onRejected;
    this.execute();
  }

  execute(): LazyPromise<T> {
    if (this.result) {
      throw new Error('then() or catch() could not be called more than once');
    }

    try {
      this.handler(
        async result => {
          if (result instanceof LazyPromise) {
            const innerResult = await result;
            if (this.onFulfilled) {
              this.result = this.onFulfilled(innerResult) as T;
            }
          } else {
            if (this.onFulfilled) {
              this.result = this.onFulfilled(result) as T;
            }
          }
        },
        reason => {
          if (this.onRejected) {
            this.reason = reason;
            this.onRejected(reason);
          }
        },
      );

      if (!this.result) {
        return this;
      }

      if (this.reason) {
        return LazyPromise.reject(this.reason);
      }

      return LazyPromise.resolve(this.result as T);
    } catch (e) {
      return LazyPromise.reject(e as Error);
    }
  }
}

/* const promise = LazyPromise.resolve(3);
promise.then((res: any) => {
  console.log(res);
  return res + 1;
});
promise.then((res: any) => {
  console.log(res);
  return res + 1;
});
promise.catch(err => {
  console.log(err);
}); */

LazyPromise.resolve<any>(1)
  /* .then((res: any) => {
    return res + 1;
  })
  .then((res: any) => {
    return res + 1;
  })
  .then((res: any) => {
    console.log('finish', res);
    return res + 1;
  }) */
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
    console.log('\tfinish', res);
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
