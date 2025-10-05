import { IQueryBuilder } from '@h3ravel/arquebus/types'
import { arquebus } from '@h3ravel/arquebus'

export class DB {
    connection?: string

    constructor(connection?: string) {
        if (connection) {
            this.connection = connection
        }
    }

    /**
     * New  instance
     */
    public static table (name: string): IQueryBuilder {
        return new DB().builder().table(name)
    }

    /**
     * Builder table instance
     */
    public static instance (connection?: string) {
        return new DB(connection).builder()
    }

    /**
     * Builder transaction instance
     */
    public static transaction<C> (callback: (...args: C[]) => any) {
        return new DB().builder().transaction(callback)
    }

    private builder () {
        return arquebus.getInstance().connection(this.connection)
    }
}
