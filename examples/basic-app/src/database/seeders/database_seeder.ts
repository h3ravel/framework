import { DB, Seeder } from '@h3ravel/database'

import BigSeeder from './big_seeder'
import BreadSeeder from './bread_seeder'
import { Hash } from '@h3ravel/hashing'
import type { QueryBuilder } from '@h3ravel/arquebus'

export default class DatabaseSeeder extends Seeder {
  /**
   * Run the database seeds.
   *
   * @param conn The current database connection 
   */
  async run (conn: QueryBuilder) {
    await conn.table('users').insert({
      name: 'John Does',
      email: 'dj@x.com',
      password: await Hash.make('password')
    })

    await DB.table('users').insert({
      name: 'John Does',
      email: 'dj@x.com',
      password: await Hash.make('password')
    })

    await this.call([
      BigSeeder,
      BreadSeeder
    ])
  }
}
