import { Command } from '@h3ravel/musket'
import { DB } from '@h3ravel/database'

export class MakeSessionTableCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = 'make:session-table'

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Create a migration for the session database table'

    public async handle () {
        await DB.instance().schema.hasTable('sessions').then(async function (exists) {
            if (!exists) {
                return DB.instance().schema.createTable('sessions', (table) => {
                    table.string('id', 255).primary()
                    table.bigInteger('user_id').nullable().index()
                    table.string('ip_address', 45).nullable()
                    table.text('user_agent').nullable()
                    table.text('payload', 'longtext').nullable()
                    table.integer('last_activity').index()
                })
            }
        })

        this.info('INFO: session table created successfully.')
    }
}
