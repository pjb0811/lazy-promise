import LazyPromise from '../index.js';

LazyPromise.resolve(3)
  .then(res => res + 1)
  .then(res => {
    return new LazyPromise(resolve => {
      setTimeout(() => resolve(res + 10), 10);
    });
  })
  .then(res => {
    console.log(res);
  });

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
    console.log(err);
  });

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
  console.log(res);
});

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
  console.log(res);
});
