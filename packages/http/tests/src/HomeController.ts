import { LinksCollection, LinksResource } from './LinksResource'

import { IController } from '@h3ravel/contracts'

export class HomeController extends IController {
    private links () {
        return {
            documentation: 'https://h3ravel.toneflix.net/introduction',
            performance: 'https://h3ravel.toneflix.net/#why-h3ravel',
            integration: 'https://h3ravel.toneflix.net/#why-h3ravel',
            features: 'https://h3ravel.toneflix.net/#features',
        }
    }

    public async index () {
        return new LinksCollection([this.links(), this.links(), this.links()]).additional({
            message: 'Resora is working'
        })
    }

    public async show () {
        return new LinksResource(this.links()).additional({
            message: 'Resora is working'
        })
    }

    public async customized () {
        return new LinksResource(this.links()).additional({
            message: 'Resora is working'
        }).response()
            .setStatusCode(201)
            .setHeaders({ 'X-Resora': 'active' })
    }
}
