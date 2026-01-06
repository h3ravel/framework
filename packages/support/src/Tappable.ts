import { CallableConstructor, ClassConstructor, ConcreteConstructor } from '@h3ravel/contracts'

import { tap } from './Helpers'

export const Tappable = <
    X extends ConcreteConstructor<ClassConstructor>
> (Base: X) => {
    return class extends Base {
        /**
         * Call the given Closure with this instance then return the instance.
         *
         * @param  callback
         */
        tap (callback?: CallableConstructor) {
            return tap(this, callback)
        }
    }
}
