import type { QueryBuilder } from '@h3ravel/arquebus'
import { Seeder } from '@h3ravel/arquebus'

export default class DatabaseSeeder extends Seeder {
  /**
   * Run the database seeds.
   *
   * @param conn The current database connection 
   */
  async run (conn: QueryBuilder) {
    conn.table('users').insert({ name: 'John Doe' })
  }
}
