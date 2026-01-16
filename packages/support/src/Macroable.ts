import { Macro, MacroMap, WithMacros } from './Contracts/Helpers'

import { BadMethodCallException } from './Exceptions/BadMethodCallException'
import { trait } from '@h3ravel/shared'

export const Macroable = <M extends MacroMap = MacroMap> () => trait((Base) => {
    return class Macroable extends Base {
        static macros: Record<string, Macro> = {}

        constructor(...args: any[]) {
            super(...args)
            return new Proxy(this, {
                get (target, prop, receiver) {
                    if (typeof prop === 'string') {
                        const ctor = target.constructor as unknown as Macroable

                        if (ctor.hasMacro(prop)) {
                            return (...args: any[]) =>
                                ctor.macros[prop].apply(receiver, args)
                        }
                    }

                    return Reflect.get(target, prop, receiver)
                }
            }) as this & WithMacros<M>

        }

        static macro (name: string, macro: Macro) {
            this.macros[name] = macro
        }

        static hasMacro (name: string): boolean {
            return Object.prototype.hasOwnProperty.call(this.macros, name)
        }

        static flushMacros () {
            this.macros = {}
        }

        static mixin (mixin: object, replace = true) {
            const proto = Object.getPrototypeOf(mixin)

            for (const key of Object.getOwnPropertyNames(proto)) {
                if (key === 'constructor') continue

                const desc = Object.getOwnPropertyDescriptor(proto, key)
                if (!desc || typeof desc.value !== 'function') continue

                if (replace || !this.hasMacro(key)) {
                    this.macro(key, desc.value.bind(mixin))
                }
            }
        }

        static createProxy<T extends typeof Macroable> (this: T): T {
            return new Proxy(this, {
                get (target, prop, receiver) {
                    if (typeof prop === 'string' && (target as any).hasMacro(prop)) {
                        return (...args: any[]) => (target as any).macros[prop](...args)
                    }

                    return Reflect.get(target, prop, receiver)
                }
            })
        }

        /**
         * Dynamically handle calls to the class.
         *
         * @param  method
         * @param  parameters
         *
         * @throws {BadMethodCallException}
         */
        static macroCallStatic (method: string, parameters: any[] = []) {
            if (!Macroable.hasMacro(method)) {
                throw new BadMethodCallException(
                    `Method ${Macroable.constructor.name}.${method} does not exist.`
                )
            }

            let macro = Macroable.macros[method]

            if (typeof macro === 'function') {
                macro = macro.bind(this)
            }

            if (typeof macro === 'function') {
                macro = macro.bind(this)
            }

            return macro(...parameters)
        }

        /**
         * Dynamically handle calls to the class.
         *
         * @param  method
         * @param  parameters
         *
         * @throws {BadMethodCallException}
         */
        macroCall (method: string, parameters: any[] = []) {
            if (!Macroable.hasMacro(method)) {
                throw new BadMethodCallException(
                    `Method ${Macroable.constructor.name}.${method} does not exist.`
                )
            }

            let macro = Macroable.macros[method]

            if (typeof macro === 'function') {
                macro = macro.bind(this)
            }

            return macro(...parameters)
        }
    }
})

export const MacroableClass = Macroable().factory(class { })
