/// <reference path="../../core/src/app.globals.d.ts" />
import { Knex } from 'knex'

type TFunction = (...args: any[]) => any

export interface TField {
    type: 'VAR_STRING' | 'BLOB' | 'DATETIME' | 'TIMESTAMP' | 'LONG' | 'JSON'
    length: number
    db: string
    table: string
    name: string
    string: TFunction,
    buffer: TFunction
    geometry: TFunction
}

export interface TBaseConfig {
    client: 'mysql' | 'mysql2' | 'sqlite3' | 'oracle' | 'mariadb' | 'pg'
    connection: {
        typeCast?(field: TField, next: TFunction): any
        dateStrings?: boolean
    }
    pool?: {
        afterCreate: (connection: TConfig, callback: (val: any, con: any) => void) => Promise<any>
    } | undefined
    connections?: Record<string, TConfig>
    migrations?: {
        table: string
        path: string
    },
    factories?: {
        path: string
    },
    seeders?: {
        path: string
    },
    models?: {
        path: string
    }
}

export type TConfig = TBaseConfig & ({
    client: 'pg'
    connection: Knex.PgConnectionConfig
} | {
    client: 'oracle'
    connection: Knex.OracleDbConnectionConfig
} | {
    client: 'mysql2'
    connection: Knex.MySql2ConnectionConfig
} | {
    client: 'mysql'
    connection: Knex.MySqlConnectionConfig
} | {
    client: 'sqlite3'
    connection: Knex.Sqlite3ConnectionConfig
    useNullAsDefault?: boolean
} | {
    client: 'mariadb'
    connection: Knex.MariaSqlConnectionConfig
    useNullAsDefault?: boolean
})

export const arquebusConfig = (config: any) => {
    return {
        sqlite: {
            client: config.connections.sqlite.driver,
            connection: <Knex.Sqlite3ConnectionConfig>{
                filename: database_path(config.connections.sqlite.database),
                debug: config.connections.sqlite.debug,
                flags: config.connections.sqlite.flags,
                options: config.connections.sqlite.options,
                expirationChecker: config.connections.sqlite.expirationChecker
            },
            useNullAsDefault: config.connections.sqlite.useNullAsDefault,
        },
        mysql: {
            client: config.connections.mysql.driver,
            connection: <Knex.MySql2ConnectionConfig>{
                host: config.connections.mysql.host ?? 'localhost',
                port: config.connections.mysql.port ?? 3306,
                user: config.connections.mysql.username ?? 'root',
                password: config.connections.mysql.password,
                database: config.connections.mysql.database,
                charset: config.connections.mysql.charset,
                socketPath: config.connections.mysql.unix_socket,
                localAddress: config.connections.mysql.url,
            },
        },
        mariadb: {
            client: config.connections.mariadb.driver,
            connection: <Knex.MariaSqlConnectionConfig>{
                host: config.connections.mariadb.host ?? 'localhost',
                port: config.connections.mariadb.port ?? 3306,
                user: config.connections.mariadb.username ?? 'root',
                password: config.connections.mariadb.password,
                database: config.connections.mariadb.database,
                charset: config.connections.mariadb.charset,
                socketPath: config.connections.mariadb.unix_socket,
                localAddress: config.connections.mariadb.url,
                expirationChecker: config.connections.mariadb.expirationChecker
            },
        },
        pgsql: {
            client: 'pg',
            connection: <Knex.PgConnectionConfig>{
                host: config.connections.pgsql.host ?? 'localhost',
                port: config.connections.pgsql.port ?? 3306,
                user: config.connections.pgsql.username ?? 'root',
                password: config.connections.pgsql.password,
                database: config.connections.pgsql.database,
                charset: config.connections.mysql.charset,
                connectionString: config.connections.pgsql.url,
                expirationChecker: config.connections.pgsql.expirationChecker
            },
        }
    } as unknown as TBaseConfig
}
