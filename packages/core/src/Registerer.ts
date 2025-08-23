import { dd, dump } from '@h3ravel/support'

export class Registerer {
    static register () {
        globalThis.dd = dd
        globalThis.dump = dump
    }
}
