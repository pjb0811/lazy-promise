/* const MyPromise = class {
  constructor(executor) {
    this.state = 'pending';
    this.laterCalls = [];
    this.decidePromiseByMethod.bind(this);
    this.applyChangedState.bind(this);

    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  applyChangedState(value, state) {
    if (!(this.state === 'pending')) return;
    if (value instanceof MyPromise) {
      value.then(innerPromiseValue => {
        this.value = innerPromiseValue;
        this.status = state;
        this.laterCalls.forEach(latercall => latercall());
      });
    } else {
      this.value = value;
      this.state = state;
      this.laterCalls.forEach(latercall => latercall());
    }
  }

  decidePromiseByMethod(method, callback) {
    const state = method === 'then' ? 'resolved' : 'rejected';
    if (this.state === state)
      return new MyPromise(resolve => resolve(callback(this.value)));

    if (this.state === 'pending')
      return new MyPromise(resolve => {
        this.laterCalls.push(() => resolve(callback(this.value)));
      });
    return this;
  }

  resolve(value) {
    this.applyChangedState(value, 'resolved');
  }

  reject(value) {
    this.applyChangedState(value, 'rejected');
  }

  then(callback) {
    return this.decidePromiseByMethod('then', callback);
  }

  catch(callback) {
    return this.decidePromiseByMethod('catch', callback);
  }
}; */

class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }

  _resolve(value) {
    console.log(this);
    if (this.state !== 'pending') return;

    this.state = 'fulfilled';
    this.result = value;

    queueMicrotask(() => {
      if (this.onFulfilled === undefined) return;

      try {
        const returnValue = this.onFulfilled(this.result);
        const isReturnValuePromise = returnValue instanceof MyPromise;

        if (!isReturnValuePromise) {
          this.thenPromiseResolve(returnValue);
        } else {
          returnValue.then(this.thenPromiseResolve, this.thenPromiseReject);
        }
      } catch (error) {
        this.thenPromiseReject(error);
      }
    });
  }

  _reject(error) {
    if (this.state !== 'pending') return;

    this.state = 'rejected';
    this.result = error;

    queueMicrotask(() => {
      if (this.onRejected === undefined) return;

      try {
        const returnValue = this.onRejected(this.result);
        const isReturnValuePromise = returnValue instanceof MyPromise;

        if (!isReturnValuePromise) {
          this.thenPromiseResolve(returnValue);
        } else {
          returnValue.then(this.thenPromiseResolve, this.thenPromiseReject);
        }
      } catch (error) {
        this.thenPromiseReject(error);
      }
    });
  }

  then(onFulfilled, onRejected) {
    const isOnFulfilledFunction = typeof onFulfilled === 'function';
    this.onFulfilled = isOnFulfilledFunction ? onFulfilled : value => value;

    const isOnRejectedFunction = typeof onRejected === 'function';
    this.onRejected = isOnRejectedFunction
      ? onRejected
      : error => {
          throw error;
        };

    return new MyPromise((resolve, reject) => {
      this.thenPromiseResolve = resolve;
      this.thenPromiseReject = reject;
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  static resolve(value) {
    const isValuePromise = value instanceof MyPromise;

    if (isValuePromise) {
      return value;
    }

    return new MyPromise(resolve => {
      resolve(value);
    });
  }

  static reject(value) {
    return new MyPromise((_, reject) => {
      reject(value);
    });
  }
}

const promise = MyPromise.resolve(3);
promise.then(res => {
  return res + 1;
});
promise.then(res => {
  return res + 1;
});
promise.catch(e => {
  console.log(e);
});

/* const test3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('첫번째 프라미스');
  }, 1000);
})
  .then(res => {
    console.log(res);
    return '두번째 프라미스';
  })
  .then(res => {
    console.log(res);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('세번째 프라미스');
      }, 1000);
    });
  })
  .then(res => {
    console.log(res);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('네번째 프라미스');
      }, 1000);
    });
  })
  .catch(err => {
    console.error(err);
    return new Error('이 에러는 then에 잡힙니다.');
  })
  .then(res => {
    // throw 하면 캐치로 가지만, 프로미스에서는 then 건너뛰고 캐치로 감
    throw new Error('이 에러는 catch에 잡힙니다.');
  })
  .then(res => {
    console.log('출력 안됨');
  })
  .catch(err => {
    console.error(err);
  }); */
