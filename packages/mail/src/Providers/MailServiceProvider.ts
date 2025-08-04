import { ServiceProvider } from '@h3ravel/core'

/**
 * Mail delivery setup.
 * 
 * Bind Mailer service.
 * Load mail drivers (SMTP, SES).
 * Register Mail facade.
 * 
 * Auto-Registered if @h3ravel/mail is installed
 */
export class MailServiceProvider extends ServiceProvider {
    public static priority = 990;

    register () {
        // Core bindings
    }
}
