type LazyPromiseHandler<T> = (resolve: (result: T | LazyPromise<T>) => void, reject: (reason: Error) => void) => void;
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
declare class LazyPromise<T> {
    private state;
    private result;
    private onFulfilled;
    private onRejected;
    queue: (() => void)[];
    constructor(handler: LazyPromiseHandler<T>);
    _resolve(result: T | LazyPromise<T>): void;
    _reject(reason: Error): void;
    static all<T>(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
    static allSync<T>(iterable: LazyPromise<T>[]): LazyPromise<T[]>;
    static resolve<T>(result: T): LazyPromise<T>;
    static reject<T>(reason: Error): LazyPromise<T>;
}
export default LazyPromise;
