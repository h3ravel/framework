import { DeliveryReport, MailDriverContract } from './Contracts/Mailer'

import { Mailable } from './Mailable'

export class Mailer {
    constructor(
        private driver: MailDriverContract,
        private edgeRenderer: (viewPath: string, data: Record<string, any>) => Promise<string>
    ) { }

    async send (mailable: Mailable): Promise<DeliveryReport | undefined | void> {
        await mailable.build()

        const options = mailable.getMessageOptions()

        if (options.viewPath && !options.html) {
            options.html = await this.edgeRenderer(options.viewPath, options.viewData || {})
        }

        try {
            return this.driver.send(options)
        } catch {
            return
        }
    }
}
