import type { H3Event } from 'h3'
import type { Middleware } from '../Middleware'

export class Kernel {
    constructor(private middleware: Middleware[] = []) { }

    async handle (event: H3Event, finalHandler: () => Promise<unknown>) {
        let index = -1

        const runner = async (i: number): Promise<unknown> => {
            if (i <= index) throw new Error('next() called multiple times')
            index = i

            const mw = this.middleware[i]
            if (mw) {
                return mw.handle(event, () => runner(i + 1))
            } else {
                return finalHandler()
            }
        }

        return runner(0)
    }
}
