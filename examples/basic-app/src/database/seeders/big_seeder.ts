import { QueryBuilder } from '@h3ravel/arquebus'
import { Seeder } from '@h3ravel/database'

export default class BigSeeder extends Seeder {
  /**
   * Run the database seeds.
   *
   * @param conn The current database connection 
   */
  async run (conn: QueryBuilder) {
    await conn.table('users').insert({
      name: 'Jude Does',
      email: 'dju@x.com',
      password: 'password'
    })
  }
}
