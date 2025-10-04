import { Controller } from '@h3ravel/core'

export class HomeController extends Controller {
    public async index () {
        console.log(url().full())
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
