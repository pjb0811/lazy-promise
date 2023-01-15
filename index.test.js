const LazyPromise = require('.').default;

describe('LazyPromise', () => {
  test('then() or catch() could not be called more than once.', () => {
    expect(() => {
      const promise = LazyPromise.resolve(3);
      promise.then(res => res + 1);
      promise.then(res => res + 10); // it should throw an error!
      promise.catch(err => {}); // it should also throw an error!
    }).toThrow();
  });

  test('the following code prints out 14 (3+1+10)', () => {
    LazyPromise.resolve(3)
      .then(res => res + 1)
      .then(res => {
        return new LazyPromise(resolve => {
          setTimeout(() => resolve(res + 10), 10);
        });
      })
      .then(res => {
        expect(res).toBe(14);
      })
      .catch(err => {});
  });

  test('The following code raises and catches an "error"', done => {
    LazyPromise.resolve(1)
      .then(res => {
        return new LazyPromise(resolve => {
          setTimeout(() => resolve(res + 1), 1000);
        });
      })
      .then(() => {
        return new LazyPromise((_, reject) => {
          setTimeout(() => reject(new Error('error')), 1000);
        });
      })
      .catch(err => {
        expect(err).toEqual(Error('error'));
        done();
      });
  });

  test('The code using all() outputs [1, 2, 3]', done => {
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
    ]).then(res => {
      expect(res).toEqual([1, 2, 3]);
      done();
    });
  });

  test('The code using allSync() outputs [1, 2, 3]', done => {
    LazyPromise.allSync([
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
    ]).then(res => {
      expect(res).toEqual([1, 2, 3]);
      done();
    });
  });
});
