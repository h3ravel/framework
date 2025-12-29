import { IController } from '@h3ravel/contracts'

export class HomeController extends IController {
    public async index () {
        return await view('index', {
            links: {
                documentation: 'https://h3ravel.toneflix.net/introduction',
                performance: 'https://h3ravel.toneflix.net/#why-h3ravel',
                integration: 'https://h3ravel.toneflix.net/#why-h3ravel',
                features: 'https://h3ravel.toneflix.net/#features',
            }
        })
    }
}
