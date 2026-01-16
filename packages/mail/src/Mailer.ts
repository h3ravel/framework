import { DeliveryReport, MailDriverContract } from './Contracts/Mailer'

import { IResponsable } from '@h3ravel/contracts'
import { Mailable } from './Mailable'

export class Mailer {
    constructor(
        private driver: MailDriverContract,
        private edgeRenderer: (viewPath: string, data: Record<string, any>) => Promise<IResponsable | string>
    ) { }

    async send (mailable: Mailable): Promise<DeliveryReport | undefined | void> {
        await mailable.build()

        const options = mailable.getMessageOptions()

        if (options.viewPath && !options.html) {
            let view = await this.edgeRenderer(options.viewPath, options.viewData || {})
            if (typeof view !== 'string') {
                view = String(view.body)
            }
            options.html = view
        }

        try {
            return this.driver.send(options)
        } catch {
            return
        }
    }
}
