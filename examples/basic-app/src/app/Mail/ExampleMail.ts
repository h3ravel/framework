import { Mailable } from '@h3ravel/mail';

export class ExampleMail extends Mailable {
    constructor(private name: string) {
        super();
    }

    async build () {
        return this
            .subject('Welcome to H3ravel')
            .view('emails/example', { name: this.name, appName: 'H3ravel' });
    }
}
