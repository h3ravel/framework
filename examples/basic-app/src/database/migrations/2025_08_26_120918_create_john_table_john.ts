import { Migration } from '@h3ravel/arquebus'
import { SchemaBuilder } from '@h3ravel/arquebus/types/query-builder';

export default class extends Migration {
  /**
    * Run the migrations.
    */
  async up(schema: SchemaBuilder) {
    await schema.createTable('john_table_john', (table) => {
      table.increments('id');
      table.timestamps();
    });
  }

  /**
    * Reverse the migrations.
    */
  async down(schema: SchemaBuilder) {
    await schema.dropTableIfExists('john_table_john');
  }
};
