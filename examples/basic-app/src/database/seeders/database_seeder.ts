import BigSeeder from './big_seeder'
import BreadSeeder from './bread_seeder'
import type { QueryBuilder } from '@h3ravel/arquebus'
import { Seeder } from '@h3ravel/database'

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
      password: 'password'
    })

    await this.call([
      BigSeeder,
      BreadSeeder
    ])
  }
}
