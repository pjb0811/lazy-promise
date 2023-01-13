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
  private state = STATE.PENDING;
  private result: T | LazyPromise<T> | Error | null = null;
  private onFulfilled: OnFulfilledHandler<T> | null = null;
  private onRejected: OnRejectedHandler | null = null;

  private resolveCallback: OnFulfilledHandler<T> = result =>
    LazyPromise.resolve(result);
  private rejectCallback: OnRejectedHandler = e =>
    setTimeout(() => {
      throw e;
    });

  constructor(handler: LazyPromiseHandler<T>) {
    this.state = STATE.PENDING;

    try {
      handler(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
      this._reject(e as Error);
    }
  }

  _resolve(result: T | LazyPromise<T>) {
    queueMicrotask(() => {
      if (this.state !== STATE.PENDING || !this.onFulfilled) {
        return;
      }
      this.state == STATE.FULFILLED;
      this.result = result;

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
    queueMicrotask(() => {
      if (this.state !== STATE.PENDING || !this.onRejected) {
        return;
      }

      this.state == STATE.REJECTED;
      this.result = e;
      this.rejectCallback(e);
    });
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

/* const promise = LazyPromise.resolve(3);
promise.then((res: any) => {
  console.log('1', res);
  return res + 1;
});
promise.then((res: any) => {
  console.log('2', res);
  return res + 1;
});
promise.catch(e => {
  console.log('3', e);
  console.log(e);
});
 */
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
    console.log('finish', res);
    return res;
  })
  .catch(err => {
    console.log('error', err);
  }); */

LazyPromise.resolve<any>('첫번째')
  .then((res: any) => {
    console.log(res);
    return '두번째 프라미스' as any;
  })
  .then(res => {
    console.log(res);
    return new LazyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve('세번째 프라미스');
      }, 1000);
    });
  })
  .then(res => {
    console.log(res);
    return new LazyPromise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('네번째 프라미스'));
      }, 1000);
    });
  })
  .then((res: any) => {
    console.log(res);
    return res;
  })
  .catch(err => {
    console.error(err);
    return new Error('이 에러는 then에 잡힙니다.');
  });
