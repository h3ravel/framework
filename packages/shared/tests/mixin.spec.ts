import { describe, expect, it, vi } from 'vitest'
import { trait, use, uses } from '../src/Mixins/TraitSystem'

import { mix } from '../src/Mixins/MixinSystem'

describe('Mixins', () => {
    describe('Mixin System', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => { })

        abstract class Magic {
            makeMagic () {
                return 'makeMagic'
            }
        }

        abstract class Magical {
            play () {
                return 'Playing'
            }

            static pause () {
                return 'Paused'
            }
        }

        abstract class IRouter {
            static call () {
                return 'Called'
            }
        }

        abstract class Proxiable {
            constructor() {
                return new Proxy(this, {
                    get (target, prop, receiver) {
                        const val = Reflect.get(target, prop, receiver) as any
                        if (typeof val === 'function' && val.name === 'proxied') return () => val().toUpperCase()

                        return val
                    }
                })
            }

            proxied () {
                return 'it worked'
            }
        }

        class Router extends mix(IRouter, Magic, Magical, Proxiable) {
            constructor() {
                super()
                console.log(this.makeMagic())
                console.log(this.play())
            }
        }

        const router = new Router()

        it('child class constructor has access to all parent methods', () => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy).toHaveBeenCalledWith('Playing')
            expect(spy).toHaveBeenCalledWith('makeMagic')
            spy.mockReset()
        })

        it('extended classes can implement proxies', () => {
            expect(router.proxied()).toBe('IT WORKED')
        })

        it('child class has acccess to all parent methods', () => {
            expect(router.makeMagic()).toBeTruthy()
            expect(router.play()).toBe('Playing')
        })

        it('child class has acccess to all static parent methods', () => {
            expect(Router.call()).toBe('Called')
            expect(Router.pause()).toBe('Paused')
        })

        it('child class is an instance of all mixed classes', () => {
            expect(router instanceof Magic).toBeTruthy()
            expect(router instanceof Magical).toBeTruthy()
            expect(router instanceof IRouter).toBeTruthy()
        })
    })

    describe('Trait System', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => { })

        const Magic = trait(Base => class Magic extends Base {
            makeMagic () {
                return 'makeMagic'
            }
        })

        const Magical = trait(Base => class Magical extends Base {
            play () {
                return 'Playing'
            }

            static pause () {
                return 'Paused'
            }
        })

        const IRouter = trait(Base => class IRouter extends Base {
            static call () {
                return 'Called'
            }
        })

        const Proxiable = trait(Base => class Proxiable extends Base {
            constructor() {
                super()
                return new Proxy(this, {
                    get (target, prop, receiver) {
                        const val = Reflect.get(target, prop, receiver) as any
                        if (typeof val === 'function' && val.name === 'proxied') return () => val().toUpperCase()

                        return val
                    }
                })
            }

            proxied () {
                return 'it worked'
            }
        })

        class Router extends use(IRouter, Magic, Magical, Proxiable) {
            constructor() {
                super()
                console.log(this.makeMagic())
                console.log(this.play())
            }
        }

        const router = new Router()

        it('child class constructor has access to all parent methods', () => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy).toHaveBeenCalledWith('Playing')
            expect(spy).toHaveBeenCalledWith('makeMagic')
            spy.mockReset()
        })

        it('traits can implement proxies', () => {
            expect(router.proxied()).toBe('IT WORKED')
        })

        it('child class has acccess to all parent methods', () => {
            expect(router.makeMagic()).toBeTruthy()
            expect(router.play()).toBe('Playing')
        })

        it('child class has acccess to all static parent methods', () => {
            expect(Router.call()).toBe('Called')
            expect(Router.pause()).toBe('Paused')
        })

        it('child class can be confirmed to be using all mixed classes', () => {
            expect(uses(router, Magic)).toBeTruthy()
            expect(uses(router, Magical)).toBeTruthy()
            expect(uses(router, IRouter)).toBeTruthy()
        })
    })
})