// import { SESConfig, SMTPConfig, SendMailConfig } from '../Contracts/Mailer'

// import { LOGDriver } from '../Drivers/LOGDriver'
import { Mailer } from '../Mailer'
// import { SESDriver } from '../Drivers/SESDriver'
// import { SMTPDriver } from '../Drivers/SMTPDriver'
// import { SendMailDriver } from '../Drivers/SendMailDriver'
import { Service } from '../Service'
import { ServiceProvider } from '@h3ravel/core'

/**
 * Mail delivery setup.
 * 
 * Bind Mailer service.
 * Load mail drivers (SMTP, SES, etc.).
 * Register Mail facade.
 * 
 */
export class MailServiceProvider extends ServiceProvider {
    public static priority = 990
    register () {
        /**
         * Register Mailer instance
         */
        this.app.singleton<any>(Mailer, () => {
            return Service.init(this.app)
        })
    }

    boot () {
        /**
         * Add logic here for global mail "from" address and others
         */
    }
}
