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

type LazyPromiseHandler<T> = (
  resolve: (result: T | LazyPromise<T>) => void,
  reject: (reason: Error) => void,
) => void;
type OnFulfilledHandler<T> = (result: T) => LazyPromise<T>;
type OnRejectedHandler = (reason: Error) => void;
class LazyPromise<T> {
  private state = STATE.PENDING;
  private result: T | LazyPromise<T> | Error | null = null;
  private onFulfilled: OnFulfilledHandler<T> | null = null;
  private onRejected: OnRejectedHandler | null = null;

  private resolveCallback: OnFulfilledHandler<T> = result =>
    LazyPromise.resolve(result);
  private rejectCallback: OnRejectedHandler = e => {
    throw e;
  };

  constructor(handler: LazyPromiseHandler<T>) {
    this.state = STATE.PENDING;

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
    const isPromise = result instanceof LazyPromise;

    if (isPromise) {
      return result;
    }
    return new LazyPromise(resolve => resolve(result));
  }

  static reject<T>(reason: Error): LazyPromise<T> {
    return new LazyPromise((_, reject) => reject(reason));
  }

  _resolve(result: T | LazyPromise<T>) {
    console.log(this);
    if (this.result) {
      throw new Error('then() or catch() could not be called more than once');
    }

    if (this.state !== STATE.PENDING) {
      return;
    }
    this.state == STATE.FULFILLED;
    this.result = result;

    queueMicrotask(() => {
      if (!this.onFulfilled) {
        return;
      }

      try {
        const value = this.onFulfilled(result as T);
        const isPromise = value instanceof LazyPromise;

        if (isPromise) {
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
    this.result = e;

    queueMicrotask(() => {
      if (!this.onRejected) {
        return;
      }
      this.onRejected(this.result as Error);
    });
  }

  then(onFulfilled: OnFulfilledHandler<T>): LazyPromise<T> {
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
    this.onRejected = onRejected;

    new LazyPromise((_, reject) => {
      this.rejectCallback = reject;
    });
  }
}

const promise = LazyPromise.resolve(3);
promise.then((res: any) => {
  return res + 1;
});
promise.then((res: any) => {
  return res + 1;
});
promise.catch(e => {
  console.log(e);
});

/* LazyPromise.resolve<any>(1)
  .then((res: any) => {
    console.log('start', res);
    return res + 1;
  })
  .then((res: any) => {
    return res + 1;
  })
  .then((res: any) => {
    return res + 1;
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
    console.log('end', res);
    return res;
  })
  .catch(err => {
    console.log('error', err);
  }); */

/* LazyPromise.resolve('첫번째')
  .then((res: any) => {
    console.log(res);
    return '두번째 프라미스' as any;
  })
  .then((res: any) => {
    console.log(res);
    return new LazyPromise((resolve: any, reject: any) => {
      setTimeout(() => {
        resolve('세번째 프라미스');
      }, 1000);
    });
  })
  .then((res: any) => {
    console.log(res);
    return new LazyPromise((resolve: any, reject: any) => {
      setTimeout(() => {
        reject('네번째 프라미스');
      }, 1000);
    });
  })
  .then((res: any) => {
    console.log(res);
    // throw 하면 캐치로 가지만, 프로미스에서는 then 건너뛰고 캐치로 감
    throw new Error('이 에러는 catch에 잡힙니다.');
  })
  .catch((err: any) => {
    console.error('error', err);
    return new Error('이 에러는 then에 잡힙니다.');
  }); */
