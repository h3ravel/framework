import { HomeController } from 'App/Http/Controllers/HomeController'
import { MailController } from 'src/app/Http/Controllers/MailController'
import { Router } from '@h3ravel/router'
import { UrlExampleController } from 'src/app/Http/Controllers/UrlExampleController'

export default (Route: Router) => {
    Route.get('/', [HomeController, 'index'])
    Route.get('/mail', [MailController, 'send'])

    // URL examples
    Route.get('/url-examples', [UrlExampleController, 'index'], 'url.examples')
    Route.get('/url-signing', [UrlExampleController, 'signing'], 'url.signing')
    Route.get('/url-manipulation', [UrlExampleController, 'manipulation'], 'url.manipulation')

    Route.get('/app', async function () {
        return await view('index', {
            links: {
                documentation: 'https://h3ravel.toneflix.net/docs',
                performance: 'https://h3ravel.toneflix.net/performance',
                integration: 'https://h3ravel.toneflix.net/h3-integration',
                features: 'https://h3ravel.toneflix.net/features',
            }
        })
    })
}
