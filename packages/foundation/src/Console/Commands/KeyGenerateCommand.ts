import { FileSystem, Logger } from '@h3ravel/shared'
import { copyFile, readFile, writeFile } from 'fs/promises'

import { Command } from '@h3ravel/musket'
import crypto from 'crypto'
import dotenv from 'dotenv'

export class KeyGenerateCommand extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `key:generate
        {--force: Force the operation to run when in production}
        {--show: Display the key instead of modifying files}
    `

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'Set the application key'

    public async handle () {
        const config = {
            key: crypto.randomBytes(32).toString('base64'),
            envPath: base_path('.env'),
            egEnvPath: base_path('.env.example'),
            updated: false,
            show: this.option('show')
        }

        this.newLine()

        // Try to create the .env file if it does not exist
        if (!await FileSystem.fileExists(config.envPath)) {
            if (await FileSystem.fileExists(config.egEnvPath)) {
                await copyFile(config.egEnvPath, config.envPath)
            } else {
                this.error('.env file not found.')
                this.newLine()
                process.exit(0)
            }
        }

        // Read and parse the .env file
        let content = await readFile(config.envPath, 'utf8')
        const buf = Buffer.from(content)
        const env = dotenv.parse(buf)

        // Show the Application key
        if (config.show) {
            // If the Application key is not exit with an erorr message
            if (!env.APP_KEY || env.APP_KEY === '') {
                this.error('Application key not set.')
                this.newLine()
                process.exit(0)
            }

            // Actually show the Application key
            const [enc, key] = env.APP_KEY.split(':')
            Logger.log([[enc, 'yellow'], [key, 'white']], ':')
            this.newLine()
            process.exit(0)
        } else if (env.APP_ENV === 'production' && !this.option('force')) {
            // If the Application is currently in production and the force flag is not set, exit with an error
            this.error('Application is currently in production, failed to set key.')
            this.newLine()
            process.exit(1)
        }

        // Check if APP_KEY exists
        if (/^APP_KEY=.*$/m.test(content)) {
            config.updated = true
            content = content.replace(/^APP_KEY=.*$/m, `APP_KEY=base64:${config.key}`)
        } else {
            // Add APP_KEY to the top, preserving existing content
            config.updated = false
            content = `APP_KEY=base64:${config.key}\n\n${content}`
        }

        // Write the application key to the .env file
        await writeFile(config.envPath, content, 'utf8')

        // Show the success message
        this.success('Application key set successfully.')
        this.newLine()
    }
}
